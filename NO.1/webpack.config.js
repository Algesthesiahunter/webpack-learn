// 1
// const path=require('path')
// const rimraf=require('rimraf')
// // 删除dist目录
// rimraf.sync('dist')
// // webpack配置
// module.exports={
//   entry:'./index',
//   mode:process.env.NODE_ENV,
//   output:{
//     filename:'bundle.js',
//     path:path.resolve(__dirname,'dist')
//   }
// }
// 2
const path = require('path');
const rimraf = require('rimraf');
const Config = require('webpack-chain');
const config = new Config();
const resolve = src => {
  return path.join(process.cwd(), src);
};

// 删除 dist 目录
rimraf.sync('dist');

config
  // 入口
  .entry('index.js')
  .add(resolve('index.js'))
  .end()
  // 模式
  // .mode(process.env.NODE_ENV) 等价下面
  .set('mode', process.env.NODE_ENV)
  // 出口
  .output.path(resolve('dist'))
  .filename('[name].bundle.js');
config.module
  .rule('css')
  .test(/\.css$/)
  .use('css')
  .loader('css-loader');

module.exports = config.toConfig();
