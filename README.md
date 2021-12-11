# wx-formdata
在小程序中使用formdata上传数据，可实现多文件上传

# 用法
跟浏览器中的FormData对象类似
引入js文件
```js
const FormData = require('./formData.js')
```
new一个FormData对象
```js
let formData = new FormData();
```
调用它的[append()](#formdataappend)方法来添加字段或者调用[appendFile()](#formdataappendfile)方法添加文件
```js
formData.append("name", "value");
formData.appendFile("file", filepath, "文件名");
```
添加完成后调用它的[getData()](#formdatagetdata)生成上传数据，之后调用小程序的wx.request提交请求
```js
let data = formData.getData();
wx.request({
  url: 'https://接口地址',
  header: {
    'content-type': data.contentType
  },
  data: data.buffer,
});
```

# 成员函数
### FormData.append()
#### 语法
```js
formData.append(name, value);
```
#### 参数
| 参数名 | 描述 |
| :---------- | :-----------|
| name | value中包含的数据对应的表单名称 |
| value | 表单的值 |

### FormData.appendFile()
#### 语法
```js
formData.appendFile(name, filepath, fileName);
```
#### 参数
| 参数名 | 描述 |
| :---------- | :-----------|
| name | value中包含的数据对应的表单名称 |
| filepath | 文件路径 | 
| fileName | 文件名【可选】 | 

### FormData.getData()
#### 语法
```js
let data = formData.getData();
```
#### 返回值对象属性
| 属性名 | 描述 |
| :---------- | :-----------|
| buffer | 表单数据的ArrayBuffer对象 |
| contentType | http请求Content-Type头部内容 | 
