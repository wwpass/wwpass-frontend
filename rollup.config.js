import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { uglify } from 'rollup-plugin-uglify';

export default [{
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend.min.js',
  },
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
      runtimeHelpers: true,
      plugins: [],
    }),
    uglify(),
  ],
},{
  input: 'src/index.js',
  output: {
    sourcemap: true,
    format: 'iife',
    file: 'dist/wwpass-frontend.js',
  },
  //treeshake: false,
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
      runtimeHelpers: true,
      plugins: []
    }),
  ],
}];
