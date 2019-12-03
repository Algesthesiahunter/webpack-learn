// 1
//css文件不能被js识别,webpack也不例外，下列css报错
// var css=require('./index.css')
// console.log(css);

// 2
const css = require("css-loader");
const s = require('index.css');
console.log(s);
const a = 100;
console.log(a, css);