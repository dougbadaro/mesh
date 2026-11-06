import { spawn } from 'node:child_process';
import { error, log } from 'node:console';
import process from 'node:process';
import electron from 'electron';
import ts from 'typescript';
import { createServer } from 'vite';

const host = '127.0.0.1';
const port = 5173;
const vite = await createServer({
  server: { host, port, strictPort: true, cors: false },
});
await vite.listen();
vite.printUrls();

let electronProcess;
let restarting = false;
let stopping = false;
let watcher;

async function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  watcher?.close();
  electronProcess?.kill();
  await vite.close();
}

function launch() {
  const child = spawn(electron, ['.', ...process.argv.slice(2)], {
    env: { ...process.env, MESH_RENDERER_URL: `http://${host}:${port}/` },
    stdio: 'inherit',
  });
  electronProcess = child;
  child.once('error', (failure) => {
    error(failure);
    void stop(1);
  });
  child.once('close', (code) => {
    electronProcess = undefined;
    if (stopping) return;
    if (restarting) {
      restarting = false;
      launch();
    } else {
      void stop(code ?? 1);
    }
  });
}

process.once('SIGINT', () => void stop(0));
process.once('SIGTERM', () => void stop(0));

const diagnostics = {
  getCanonicalFileName: (name) => name,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine,
};
const compiler = ts.createWatchCompilerHost(
  'tsconfig.main.json',
  {},
  ts.sys,
  ts.createEmitAndSemanticDiagnosticsBuilderProgram,
  (diagnostic) => error(ts.formatDiagnostic(diagnostic, diagnostics).trimEnd()),
  (status) => log(ts.flattenDiagnosticMessageText(status.messageText, ts.sys.newLine)),
);
const afterBuild = compiler.afterProgramCreate;
compiler.afterProgramCreate = (builder) => {
  afterBuild?.(builder);
  const hasErrors = ts.getPreEmitDiagnostics(builder.getProgram())
    .some((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error);
  if (stopping || hasErrors) return;

  if (electronProcess) {
    restarting = true;
    electronProcess.kill();
  } else {
    launch();
  }
};
watcher = ts.createWatchProgram(compiler);
