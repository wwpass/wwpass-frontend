import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [{
  input: 'src/uionly.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend-ui.js',
  },
  treeshake: true,
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      plugins: []
    }),
  ],
},{
  input: 'src/uionly.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend-ui.min.js',
  },
  treeshake: true,
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      browser: true
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      plugins: []
    }),
    terser(),
  ],
}];
