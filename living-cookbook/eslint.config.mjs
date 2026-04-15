import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
  ...nextVitals,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // OBS-008 (ADR-010): Warn on every supabaseAdmin import to force explicit acknowledgement
  // of the RLS bypass. Add a comment at the import site explaining why bypass is appropriate.
  // See ADR-007 for governance rules and audit expectations.
  {
    rules: {
      'no-restricted-imports': ['warn', {
        paths: [{
          name: '@/lib/supabase/admin',
          message: 'supabaseAdmin bypasses all RLS policies. Add a comment at the import site justifying why bypass is appropriate for this specific operation. Reference ADR-007.',
        }],
      }],
    },
  },
]);

export default eslintConfig;
