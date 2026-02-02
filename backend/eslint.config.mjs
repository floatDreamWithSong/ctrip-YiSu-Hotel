import nestJsConfig from '@yisu/eslint-config/nest';

/** @type {import("eslint").Linter.Config} */
export default [
  ...nestJsConfig,
  {
    ignores: ['.prettierrc.mjs', 'eslint.config.mjs'],
  },
];
