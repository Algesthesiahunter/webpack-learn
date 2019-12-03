// 1
//css文件不能被js识别,webpack也不例外，下列css报错
// var css=require('./index.css')
// console.log(css);

// // 2
// const css = require('css-loader!./index.css');
// const a = 100;
// console.log(a, css);

// 3
// const css = import('css-loader!./index.css');
// const a = 100;
// console.log(a, css);
// 4
const css = import('./index.css');
const a = 100;
console.log(a, css);