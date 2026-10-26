import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([
    ".next/**",
    ".next-build/**",
    ".next-stale-*/**",
    ".next-motion-check/**",
    ".next-switch-check/**",
    ".next-scenario-check/**",
    ".next-final-scenario/**",
    ".next-verify-*/**",
    "out/**",
    ".wrangler/**",
    "worker/.wrangler/**",
    "worker/src/generated/**",
    "coverage/**",
    "next-env.d.ts"
  ])
]);
