const mimeMap = require('./mimeMap.js')

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
      postArray = postArray.concat(formDataArray(boundary, key, data[key]));
    }
  }
  //拼接文件
  if(files && Object.prototype.toString.call(files) == "[object Array]"){
    for(let i in files){
      let file = files[i];
      postArray = postArray.concat(formDataArray(boundary, file.name, file.buffer, file.fileName));
    }
  }
  //结尾
  let endBoundaryArray = [];
  endBoundaryArray.push(...endBoundary.toUtf8Bytes());
  postArray = postArray.concat(endBoundaryArray);
  return {
    contentType: 'multipart/form-data; boundary=' + boundaryKey,
    buffer: new Uint8Array(postArray).buffer
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
  dataArray.push(...dataString.toUtf8Bytes());

  if (isFile) {
    let fileArray = new Uint8Array(value);
    dataArray = dataArray.concat(Array.prototype.slice.call(fileArray));
  }
  dataArray.push(..."\r".toUtf8Bytes());
  dataArray.push(..."\n".toUtf8Bytes());

  return dataArray;
}

function getFileMime(fileName){
  let idx = fileName.lastIndexOf(".");
  let mime = mimeMap[fileName.substr(idx)];
  return mime?mime:"application/octet-stream"
}

String.prototype.toUtf8Bytes = function(){
  var str = this;
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    bytes.push(...str.utf8CodeAt(i));
    if (str.codePointAt(i) > 0xffff) {
      i++;
    }
  }
  return bytes;
}

String.prototype.utf8CodeAt = function(i) {
  var str = this;
  var out = [], p = 0;
  var c = str.charCodeAt(i);
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
  return out;
};


module.exports = FormData;

