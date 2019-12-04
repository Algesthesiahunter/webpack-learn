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
  entry: './index',
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

### 解析 bundle 如何加载模块

删掉了一些注释跟一些干扰内容，这样看起来会更清晰一点

- `bundle` 是一个立即执行函数，可以认为它是把所有模块捆绑在一起的一个巨型模块。
- webpack 将所有模块打包成了 `bundle` 的依赖，通过一个对象注入
- `0 模块` 就是入口
- `webpack` 通过 `__webpack_require__` 引入模块
- `__webpack_require__` 就是我们使用的 `require`，被`webpack` 封装了一层
dist/bundle.js

``` js
(function(modules) {
  function __webpack_require__(moduleId) {
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {}
    });

    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    module.l = true;

    return module.exports;
  }
  return __webpack_require__((__webpack_require__.s = 0));
})({
  './index.js': function(module, exports, __webpack_require__) {
    eval(`
      const css = __webpack_require__("./style/index.css")
      const a = 100;
      console.log(a, css)
    `);
  },

  './style/index.css': function(module, exports, __webpack_require__) {
    eval(`
      exports = module.exports = __webpack_require__("./node_modules/css-loader/dist/runtime/api.js")(false);
      exports.push([module.i, "body {
        width: 100%;
        height: 100vh;
        background-color: orange;
      }", ""]);
    `);
  },

  0: function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__('./index.js');
  }
});
```

### 运行过程

将`require`后的参数`css-loader!./index.css`转化为

``` js
{
  './index.js': function(module, exports, __webpack_require__) {
    eval(`
      const css = __webpack_require__("./style/index.css")
      const a = 100;
      console.log(a, css)
    `);
  },

  './style/index.css': function(module, exports, __webpack_require__) {
    eval(`
      exports = module.exports = __webpack_require__("./node_modules/css-loader/dist/runtime/api.js")(false);
      exports.push([module.i, "body {
        width: 100%;
        height: 100vh;
        background-color: orange;
      }", ""]);
    `);
  },

  0: function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__('./index.js');
  }
}
```

作为参数传入到主函数内，`0模块`就是`index.js`也是我们这个函数主入口，`__webpack_require__`其实是`webpack`更具`js解析原理`封装的一个`require`优化（优化有缓存等等），

``` js
xxx:function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(xxx);
  }
```

其实就是多含一层`__webpack_require__`，并将各个模块暴露给js解析器解析。

## 动态 import 加载原理

`import` 是只有用到的时候才回去加载,`require`是声明就会加载，`webpack`遇到`require`就会把它当成一个模块加载到`bundle`里

### require 改成important

index.js

``` js
// const css = require('css-loader!./index.css');
const css = import('css-loader!./index.css');
const a = 100;
console.log(a, css);
```

### 动态加载打包结果

除了正常的 `bundle` 之外，我们还可以看见一个 `0.boundle.js`

`0.boundle.js` 就是我们的动态加载的 `index.css` 模块

``` js
|-- bundle.js
|-- 0.boundle.js
```

动态模块
0.boundle.j
这个文件就是把我们 `import` 的模块放进了一个单独的 `js` 文件中

``` js

(window['webpackJsonp'] = window['webpackJsonp'] || []).push([
  [0],
  {
    './node_modules/css-loader/dist/runtime/api.js': function(
      module,
      exports,
      __webpack_require__
    ) {
      'use strict';
      eval(`
        ...
      `);
    },

    './style/index.css': function(module, exports, __webpack_require__) {
      eval(`
        exports = module.exports = __webpack_require__("./node_modules/css-loader/dist/runtime/api.js")(false));
        exports.push([module.i, \`body {
          width: 100%;
          height: 100vh;
          background-color: orange;
        },"\`]
      `);
    }
  }
]);
```

### 动态模块加载逻辑

我们再看下 dist/bundle.js

方便理解，我把大部分代码和注释都删掉了

原理很简单，就是利用的 jsonp 的实现原理加载模块，只是在这里并不是从 server 拿数据而是从其他模块中

1. 调用模块时会在 `window` 上注册一个 `webpackJsonp` 数组，`window['webpackJsonp'] = window['webpackJsonp'] || []`
2. 当我们 `import`时，`webpack` 会调用 `__webpack_require__.e(0)` 方法，也就是 `requireEnsure`
3. `webpack` 会动态创建一个 `script` 标签去加载这个模块，加载成功后会将该模块注入到 `webpackJsonp` 中
4. `webpackJsonp.push` 会调用 `webpackJsonpCallback` 拿到模块
5. 模块加载完（then）再使用 `__webpack_require__` 获取模块

``` js
(function(modules) {
  function webpackJsonpCallback(data) {
    var chunkIds = data[0];
    var moreModules = data[1];
    var moduleId,
      chunkId,
      i = 0,
      resolves = [];
    for (; i < chunkIds.length; i++) {
      chunkId = chunkIds[i];
      if (
        Object.prototype.hasOwnProperty.call(installedChunks, chunkId) &&
        installedChunks[chunkId]
      ) {
        resolves.push(installedChunks[chunkId][0]);
      }
      // 模块安装完
      installedChunks[chunkId] = 0;
    }
    for (moduleId in moreModules) {
      if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
        modules[moduleId] = moreModules[moduleId];
      }
    }
    if (parentJsonpFunction) parentJsonpFunction(data);
    while (resolves.length) {
      // 执行所有 promise 的 resolve 函数
      resolves.shift()();
    }
  }

  function jsonpScriptSrc(chunkId) {
    return __webpack_require__.p + '' + ({}[chunkId] || chunkId) + '.bundle.js';
  }

  function __webpack_require__(moduleId) {
    // ...
  }

  __webpack_require__.e = function requireEnsure(chunkId) {
    var promises = [];
    // ...
    var script = document.createElement('script');
    var onScriptComplete;
    script.charset = 'utf-8';
    script.timeout = 120;
    script.src = jsonpScriptSrc(chunkId);

    onScriptComplete = function(event) {
      // 处理异常，消除副作用
      // ...
    };
    var timeout = setTimeout(function() {
      onScriptComplete({ type: 'timeout', target: script });
    }, 120000);
    script.onerror = script.onload = onScriptComplete;
    document.head.appendChild(script);
    // ...
    // 动态加载模块
    return Promise.all(promises);
  };

  var jsonpArray = (window['webpackJsonp'] = window['webpackJsonp'] || []);
  // 重写数组 push 方法
  jsonpArray.push = webpackJsonpCallback;
  jsonpArray = jsonpArray.slice();
  for (var i = 0; i < jsonpArray.length; i++)
    webpackJsonpCallback(jsonpArray[i]);

  return __webpack_require__((__webpack_require__.s = 0));
})({
  './index.js': function(module, exports, __webpack_require__) {
    eval(`
        const css = __webpack_require__.e(0).then(__webpack_require__.t.bind(null, "./style/index.css", 7))
        const a = 100;
        console.log(a, css)
      `);
  },
  0: function(module, exports, __webpack_require__) {
    eval(`module.exports = __webpack_require__("./index.js");`);
  }
});
```

## 使用 webpack-chain 重写配置

我们用 webpack-chain 来写 webpack 的配置，原因是 webpack-chain 的方式更加灵活

官方解释

webpack-chain 尝试通过提供可链式或顺流式的 API 创建和修改 webpack 配置。API 的 Key 部分可以由用户指定的名称引用，这有助于跨项目修改配置方式的标准化。

``` js
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
  .entry('src/index')
  .add(resolve('src/index.js'))
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
```

至此学习了

- webpack 基础配置
- 将 css 通过 css-loader 打包进 js 中
- 解析 bundle 如何加载模块的
- webpack 如何实现的动态加载模块
