const express = require("express");
// body-parser是一个HTTP请求体解析中间件，可以解析JSON、Raw、Text和URL编码的请求体
const bodyParser = require("body-parser");
// 文件系统
const fs = require("fs");

const { getLocalIP, addFile, delFile } = require("./utils");
const { v4: uuidv4 } = require("uuid");
// multer是一个node.js中间件，用于处理multipart/form-data类型的表单数据，它主要用于上传文件
const multer = require("multer");
// multiparty是一个node.js中间件，用于处理multipart/form-data类型的表单数据，它主要用于上传文件
const multiparty = require('multiparty');
const EventEmitter = require('events');

const path = require('path');

const { Buffer } = require('buffer');

// 临时文件存储路径
const STATIC_TEMPORARY = path.resolve(__dirname, './static/temporaryFolder');
// 文件存储路径
const STATIC_FILES = path.resolve(__dirname, './static');

// 创建server实例
const app = express();
//设置跨域访问
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  next();
});

// 中间件
app.use('/static', express.static('server/static')); // 静态资源
app.use(bodyParser.json()); // 解析json

// 创建磁盘存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/static/"); // 保存的路径，备注：需要自己创建
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 保存的文件名
  },
});
// 创建multer实例
const upload = multer({ storage });

/* 单文件上传 */
// file是文件域的name,必须和前端formdata的key一致
app.post("/upload", upload.single("file"), async (req, res) => {
  //req.body是普通表单域
  //req.file是文件域
  let msg = {
    body: req.body,
    file: req.file,
    code: 200,
    id: uuidv4(),
  };
  await addFile(msg, path.resolve(__dirname + "/static/relative/index.json"));
  res.json(msg);
});

app.get('/merge', async (req, res) => {
  const { filename } = req.query;

  try {
    let len = 0;
    const bufferList = fs.readdirSync(`${STATIC_TEMPORARY}/${filename}`).map(hash => {
      const buffer = fs.readFileSync(`${STATIC_TEMPORARY}/${filename}/${hash}`);
      len += buffer.length;
      return buffer;
    });

    const buffer = Buffer.concat(bufferList, len);
    const ws = fs.createWriteStream(`${STATIC_FILES}/${filename}`);
    ws.write(buffer);
    ws.close();

    res.send(`切片合并完成`);
  } catch (error) {
    console.error(error);
  }
});

app.post("/uploadMulti", async (req, res) => {
  const multipart = new multiparty.Form();
  const myEmitter = new EventEmitter();
  const formData = {
    filename: undefined,
    hash: undefined,
    chunk: undefined,
  };

  multipart.parse(req, function (err, fields, files) {
    formData.chunk = files['chunk'][0];
    formData.filename = fields['filename'][0];
    formData.hash = fields['hash'][0];
    myEmitter.emit('start');
  });

  myEmitter.on('start', function () {
    const { filename, hash, chunk } = formData;
    const dir = `${STATIC_TEMPORARY}/${filename}`;
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      const buffer = fs.readFileSync(chunk.path);
      const ws = fs.createWriteStream(`${dir}/${hash}`);
      ws.write(buffer);
      ws.close();
      res.send(`${filename}-${hash} 切片上传成功`);
    } catch (error) {
      console.error(error);
    }
  });
});

// 下载文件
app.get("/download", (req, res) => {
  const cs = fs.createReadStream(__dirname + "/../src/assets/blob.png");
  cs.on("data", (chunk) => {
    res.write(chunk);
  });
  cs.on("end", () => {
    res.status(200);
    res.end();
  });
});

// 校验文件是否存在
app.post("/checkFile", (req, res) => {
  const { md5 } = req.body;
  fs.readFile(
    __dirname + "/static/relative/index.json",
    "utf-8",
    function (err, data) {
      data = JSON.parse(data);
      const list = data?.list || [];
      const isExist = list.some((item) => item.body.md5 === md5);
      res.json({
        code: 200,
        isExist,
      });
    }
  );
});

app.post("/delFile", async (req, res) => {
  const { id } = req.body;
  await delFile(id, __dirname + "/static/relative/index.json");
  res.json({
    code: 200,
    msg: '删除成功'
  });
});

// 获取所有文件
app.get("/getAllFile", (req, res) => {
  fs.readFile(
    __dirname + "/static/relative/index.json",
    "utf-8",
    function (err, data) {
      data = JSON.parse(data);
      const list = data?.list || [];
      res.json(list.map((item) => {
        return {
          ...item,
          url: `http://${getLocalIP()}:${port}/static/${item.file.filename}`,
        };
      }));
    }
  );
});


const port = 1111;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

