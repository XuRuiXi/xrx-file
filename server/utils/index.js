const os = require('os');
const fs = require('fs');

function getLocalIP() {
  var interfaces = os.networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
}

function addFile(info, path) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path,
      "utf-8",
      function (err, data) {
        data = JSON.parse(data);
        if (!data.list) {
          data.list = [];
        }
        data.list.push(info);
        fs.writeFile(
          path,
          JSON.stringify(data, null, 2),
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve("写入成功");
            }
          }
        );
      }
    );
  });
}


const delFile = (id, path) => {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path,
      "utf-8",
      function (err, data) {
        data = JSON.parse(data);
        const list = data?.list || [];
        const mapFIle = list.find((item) => item.id === id);
        const newList = list.filter((item) => item.id !== id);
        data.list = newList;
        fs.writeFile(
          path,
          JSON.stringify(data, null, 2),
          function (err) {
            resolve(err);
          }
        );
        // 删除文件
        fs.unlink(
          mapFIle.file.path,
          function (err) {
            if (err) {
              reject(err);
            } else {
              resolve("删除成功");
            }
          }
        );
      }
    );
  });

};


module.exports = {
  getLocalIP,
  addFile,
  delFile,
};