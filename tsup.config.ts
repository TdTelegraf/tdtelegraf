export const options = {
  entry: ['src/**/*.tsx?'],
  treeshake: true,
  sourcemap: true,
  splitting: true,
  platform: 'node',
  shims: true,
  dts: true,
  outDir: 'lib',
};

export const optionsESM = {
  ...options,
  format: 'esm',
  dts: true,
  outExtension: () => ({ js: '.js', dts: '.d.ts' }),
  outDir: 'lib',
};

export const optionsCJS = {
  ...options,
  format: 'cjs',
  dts: {
    compilerOptions: {
      target: 'ES5',
      module: 'commonjs',
      moduleResolution: 'node',
    },
  },
  outExtension: () => ({ js: '.js', dts: '.d.ts' }),
  outDir: 'cjs',
};

export default [optionsCJS, optionsESM];
