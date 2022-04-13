import babel from '@rollup/plugin-babel';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';

export default [{
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend.min.js'
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
    terser()
  ]
}, {
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend.js'
  },
  treeshake: true,
  plugins: [
    json(),
    resolve({
      jsnext: true,
      main: true,
      browser: true,
      preferBuiltins: false
    }),
    commonjs(),
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      plugins: []
    })
  ]
}];
