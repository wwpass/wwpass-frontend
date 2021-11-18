
module.exports = {
  presets: [
    ['@babel/preset-env', {
      modules: false,
      targets: {
        ie: 11,
        browsers: 'last 2 versions'
      },
      useBuiltIns: 'usage',
    }]
],
  plugins: [
    "@babel/plugin-transform-runtime"
  ],
  env: {
    rollup: {
    },
    test: {
      presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
      plugins: ['rewire']
    }
  }
}
