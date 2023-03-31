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

function updateJson(info, path) {
  fs.readFile(
    path,
    "utf-8",
    function (err, data) {
      data = JSON.parse(data || "{}");
      if (!data.list) {
        data.list = [];
      }
      data.list.push(info);
      fs.writeFile(
        path,
        JSON.stringify(data, null, 2),
        function (err) {
          if (err) {
            console.log("写入失败");
          } else {
            console.log("写入成功");
          }
        }
      );
    }
  );
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
        console.log(mapFIle.file.path);
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

const addFile = (from, to) => {
  // len是文件的buffer总长度
  let len = 0;
  const bufferList = fs.readdirSync(from).map(hash => {
    const buffer = fs.readFileSync(`${from}/${hash}`);
    len += buffer.length;
    return buffer;
  });
  const buffer = Buffer.concat(bufferList, len);
  const ws = fs.createWriteStream(to);
  ws.write(buffer);
  ws.close();
  deleteFolder(from);
};

// 删除文件夹
function deleteFolder(filepath) {
  if (fs.existsSync(filepath)) {
    // 入股存
    fs.readdirSync(filepath).forEach(filename => {
      const fp = `${filepath}/${filename}`;
      // 如果是目录，则递归删除
      if (fs.statSync(fp).isDirectory()) {
        deleteFolder(fp);
      } else {
        // 删除文件
        fs.unlinkSync(fp);
      }
    });
    // 删除目录
    fs.rmdirSync(filepath);
  }
}


module.exports = {
  getLocalIP,
  updateJson,
  delFile,
  addFile,
};