const mimeMap = require('./mimeMap.js')

// const coder = new TextEncoder();
const coder = function() {
  const encode = (str)=>{
      const bytes = [];
      for (let i = 0; i < str.length; i++) {
          let out = [], p = 0;
          const c = str.charCodeAt(i);
          if (c < 128) {
              out[p++] = c;
          } else if (c < 2048) {
              out[p++] = (c >> 6) | 192;
              out[p++] = (c & 63) | 128;
          } else if (
              ((c & 0xFC00) == 0xD800) && (i + 1) < str.length &&
              ((str.charCodeAt(i + 1) & 0xFC00) == 0xDC00)) {
              // Surrogate Pair
              c = 0x10000 + ((c & 0x03FF) << 10) + (str.charCodeAt(++i) & 0x03FF);
              out[p++] = (c >> 18) | 240;
              out[p++] = ((c >> 12) & 63) | 128;
              out[p++] = ((c >> 6) & 63) | 128;
              out[p++] = (c & 63) | 128;
          } else {
              out[p++] = (c >> 12) | 224;
              out[p++] = ((c >> 6) & 63) | 128;
              out[p++] = (c & 63) | 128;
          }
          bytes.push(...out);
          if (c > 0xffff) i++;
      }
      return bytes;
  }
  return {
      encode,
  }
}();


function FormData(){
  let fileManager = wx.getFileSystemManager();
  let data = {};
  let files = [];

  this.append = (name, value)=>{
    data[name] = value;
    return true;
  }

  this.appendFile = (name, path, fileName)=>{
    let buffer = fileManager.readFileSync(path);
    if(Object.prototype.toString.call(buffer).indexOf("ArrayBuffer") < 0){
      return false;
    }

    if(!fileName){
      fileName = getFileNameFromPath(path);
    }

    files.push({
      name: name,
      buffer: buffer,
      fileName: fileName
    });
    return true;
  }

  this.getData = ()=>convert(data, files)
}

function getFileNameFromPath(path){
  let idx=path.lastIndexOf("/");
  return path.substr(idx+1);
}

function convert(data, files){
  let boundaryKey = 'wxmpFormBoundary' + randString(); // 数据分割符，一般是随机的字符串
  let boundary = '--' + boundaryKey;
  let endBoundary = boundary + '--';

  let postArray = [];
  //拼接参数
  if(data && Object.prototype.toString.call(data) == "[object Object]"){
    for(let key in data){
      postArray.push(...formDataArray(boundary, key, data[key]));
    }
  }
  //拼接文件
  if(files && Object.prototype.toString.call(files) == "[object Array]"){
    for(let i in files){
      let file = files[i];
      postArray.push(...formDataArray(boundary, file.name, file.buffer, file.fileName));
    }
  }
  //结尾
  postArray.push(coder.encode(endBoundary));
  const lenMap = postArray.map(e=>e.length);
  const u8Arr = new Uint8Array(lenMap.reduce((p,c)=>p+c, 0));
  let offset = 0;
  postArray.forEach((d,i)=>{
      if (i==0) u8Arr.set(d);
      else u8Arr.set(d, offset);
      offset += d.length;
  });
    
  return {
    contentType: 'multipart/form-data; boundary=' + boundaryKey,
    buffer: u8Arr.buffer,
  }
}

function randString() {
  var result = '';
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  for (var i = 17; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function formDataArray(boundary, name, value, fileName){
  let dataString = '';
  let isFile = !!fileName;

  dataString += boundary + '\r\n';
  dataString += 'Content-Disposition: form-data; name="' + name + '"';
  if (isFile){
    dataString += '; filename="' + fileName + '"' + '\r\n';
    dataString += 'Content-Type: ' + getFileMime(fileName) + '\r\n\r\n';
  }
  else{
    dataString += '\r\n\r\n';
    dataString += value;
  }

  var dataArray = [];
  dataArray.push(coder.encode(dataString));

  if (isFile) {
    dataArray.push(new Uint8Array(value));
  }
  dataArray.push(coder.encode("\r"));
  dataArray.push(coder.encode("\n"));

  return dataArray;
}

function getFileMime(fileName){
  let idx = fileName.lastIndexOf(".");
  let mime = mimeMap[fileName.substr(idx)];
  return mime?mime:"application/octet-stream"
}

module.exports = FormData;

