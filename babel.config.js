
module.exports = {
  presets: [
    [
      '@babel/preset-env'
    ]
  ],
  plugins: [
    "@babel/plugin-transform-runtime"
  ],
  env: {
    rollup: {
      presets: [
        ['@babel/preset-env', {modules: false}]
      ]
    },
    test: {
      presets: [['@babel/preset-env', {targets: {node: 'current'}}]],
      plugins: ['rewire']
    }
  }
}
