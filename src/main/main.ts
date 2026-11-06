import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain, Menu, net, protocol, session, type IpcMainInvokeEvent } from 'electron';
import { openTransactionStore } from './transaction-store.js';
import type { TransactionDraft } from './transactions.js';

const appUrl = 'financas://app/';
const devUrl = process.env.MESH_RENDERER_URL;
const rendererUrl = !app.isPackaged && devUrl && /^http:\/\/127\.0\.0\.1:\d+\/$/.test(devUrl)
  ? devUrl
  : appUrl;
const rendererDir = join(app.getAppPath(), 'dist', 'renderer');

protocol.registerSchemesAsPrivileged([
  { scheme: 'financas', privileges: { standard: true, secure: true } },
]);

function openWindow() {
  const window = new BrowserWindow({
    title: 'Mesh',
    width: 1100,
    height: 720,
    minWidth: 420,
    minHeight: 420,
    show: false,
    backgroundColor: '#0d0c10',
    ...(process.platform !== 'darwin' && {
      titleBarStyle: 'hidden',
      titleBarOverlay: { color: '#0d0c10', symbolColor: '#e4d9f0', height: 60 },
    }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(app.getAppPath(), 'dist', 'main', 'preload.cjs'),
    },
  });

  window.once('ready-to-show', () => {
    window.maximize();
    window.show();
  });
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.webContents.on('will-redirect', (event) => event.preventDefault());
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  void window.loadURL(rendererUrl).catch((error: unknown) => {
    console.error('Falha ao abrir a interface.', error);
    app.exit(1);
  });
}

void app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const transactions = openTransactionStore(join(app.getPath('userData'), 'mesh.sqlite'));
  app.once('will-quit', () => transactions.close());

  function checkSender(event: IpcMainInvokeEvent) {
    if (event.senderFrame !== event.sender.mainFrame || event.senderFrame?.url !== rendererUrl) {
      throw new Error('Origem inválida.');
    }
  }

  ipcMain.handle('transactions:list', (event) => {
    checkSender(event);
    return transactions.list();
  });
  ipcMain.handle('transactions:save', (event, input: TransactionDraft, id?: number) => {
    checkSender(event);
    return transactions.save(input, id);
  });
  ipcMain.handle('transactions:remove', (event, id: number) => {
    checkSender(event);
    transactions.remove(id);
  });

  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, respond) => {
    respond(false);
  });

  protocol.handle('financas', async (request) => {
    const url = new URL(request.url);
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const isAsset = /^assets\/[\w-]+\.(?:js|css|svg)$/.test(file);
    if (url.host !== 'app' || request.method !== 'GET' || (file !== 'index.html' && !isAsset)) {
      return new Response(null, { status: 404 });
    }

    const asset = await net.fetch(pathToFileURL(join(rendererDir, file)).href);
    const headers = new Headers(asset.headers);
    headers.set('Content-Security-Policy', "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; base-uri 'none'; frame-ancestors 'none'");
    return new Response(asset.body, { status: asset.status, headers });
  });

  openWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openWindow();
  });
}).catch((error: unknown) => {
  console.error('Falha ao iniciar o Mesh.', error);
  app.exit(1);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
