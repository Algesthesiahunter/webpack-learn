# 初探webpack打包原理

先运行个小例子：
index.js

``` js
var css=require('./index.css')
console.log(css);
```

css文件不能被js识别,webpack也不例外，下列css报错
要想让webpack识别css，webpack内部提供了loader机制，可以通过loader将任意文件转成webpack可识别的文件

## webpack 基础配置

### 需要的依赖包

package.json

``` json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development webpack", // 开发环境
    "build": "cross-env NODE_ENV=production webpack" // 生产环境
  },
  "dependencies": {
    "cross-env": "^6.0.3", // 兼容各种环境
    "css-loader": "^3.2.0",
    "rimraf": "^3.0.0", // 删除文件
    "webpack": "^4.41.2"
  },
  "devDependencies": {
    "webpack-cli": "^3.3.10"
  }
}
```

### webpack.config.js 基础配置

webpack.config.js

``` js
const path = require('path');
const rimraf = require('rimraf');

// 删除 dist 目录
rimraf.sync('dist');

// webpack 配置
module.exports = {
  entry: './src/index',
  mode: process.env.NODE_ENV,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
```

### css 引入到js

index.js

``` js
      const css = require('css-loader!./index.css');
const a = 100;
console.log(a, css);
```
