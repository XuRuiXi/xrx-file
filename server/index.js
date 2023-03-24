const express = require("express");
// body-parser是一个HTTP请求体解析中间件，可以解析JSON、Raw、Text和URL编码的请求体
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
const { getLocalIP, addFile, delFile } = require("./utils");
const { v4: uuidv4 } = require("uuid");
// multer是一个node.js中间件，用于处理multipart/form-data类型的表单数据，它主要用于上传文件
const multer = require("multer");

//设置跨域访问
app.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", " 3.2.1");
  next();
});

// 中间件
app.use('/images', express.static('server/images'));
app.use(bodyParser.json());

// 创建磁盘存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/images/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
// 创建multer实例
const upload = multer({ storage });

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
  const result = await addFile(msg, __dirname + "/images/relative/index.json");
  console.log(result);
  res.json(msg);
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
    __dirname + "/images/relative/index.json",
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
  const result =await delFile(id, __dirname + "/images/relative/index.json");
  console.log(result);
  res.json({
    code: 200,
    msg: '删除成功'
  });
});

// 获取所有文件
app.get("/getAllFile", (req, res) => {
  fs.readFile(
    __dirname + "/images/relative/index.json",
    "utf-8",
    function (err, data) {
      data = JSON.parse(data);
      const list = data?.list || [];
      res.json(list.map((item) => {
        return {
          ...item,
          url: `http://${getLocalIP()}:1111/images/${item.file.filename}`,
        };
      }));
    }
  );
});


const port = 1111;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

