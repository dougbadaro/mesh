import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"
import prettierConfig from "eslint-config-prettier"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import unusedImports from "eslint-plugin-unused-imports"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "simple-import-sort/exports": "error",
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react", "^@?\\w"],
            ["^@/components"],
            ["^@/lib", "^@/hooks", "^@/utils", "^@/app/actions"],
            ["^\\."],
            ["^.+\\.?(css)$"],
          ],
        },
      ],
    },
  },
  prettierConfig,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
])

export default eslintConfig
