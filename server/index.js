const express = require("express");
// body-parser是一个HTTP请求体解析中间件，可以解析JSON、Raw、Text和URL编码的请求体
const bodyParser = require("body-parser");
// 文件系统
const fs = require("fs");
const cheerio = require("cheerio");

const { getLocalIP, updateJson, delFile, addFile, getLeftTime } = require("./utils");
const { v4: uuidv4 } = require("uuid");
// multer是一个node.js中间件，用于处理multipart/form-data类型的表单数据，它主要用于上传文件
const multer = require("multer");
// multiparty是一个node.js中间件，用于处理multipart/form-data类型的表单数据，它主要用于上传文件
const multiparty = require('multiparty');

const path = require('path');


// 临时文件存储路径
const STATIC_TEMPORARY = path.resolve(__dirname, './static/temporaryFolder');
// 文件存储路径
const STATIC_FILES = path.resolve(__dirname, './static/assets');

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
app.use('/static', express.static(STATIC_FILES)); // 静态资源
app.use(bodyParser.json()); // 解析json

// 不要校验/login接口,其他接口都要校验
const whiteList = ["/login", "/logout", "/xianyu", "/getTime", "/updateTime"];
app.use((req, res, next) => {
  if (whiteList.includes(req.path)) {
    next();
  } else {
    const { authorization: token } = req.headers;
    if (token) {
      // 同步读取/user/index.json文件
      let data = fs.readFileSync(path.resolve(__dirname + "/user/index.json"));
      // 将读取到的数据转换为json对象
      data = JSON.parse(data || "{}");
      const list = data?.list || [];
      const user = list.find(item => item.token === token);
      if (user) {
        // 校验是否过期
        if (user.expire > Date.now()) {
          next();
          // 更新过期时间
          user.expire = Date.now() + 1000 * 60 * 30;
          // 同步写入文件
          fs.writeFileSync(
            path.resolve(__dirname + "/user/index.json"),
            JSON.stringify(data, null, 2)
          );
        } else {
          res.json({
            code: 401,
            msg: "登录过期",
          });
        }
      } else {
        res.json({
          code: 401,
          msg: "请重新登录",
        });
      }
    } else {
      res.json({
        code: 401,
        msg: "请先登录",
      });
    }
  }

});

// 创建磁盘存储引擎
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, STATIC_FILES); // 保存的路径，备注：需要自己创建
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // 保存的文件名
  },
});
// 创建multer实例
const upload = multer({
  storage,
  fileFilter(req, file, callback) {
    // 解决中文名乱码的问题 latin1 是一种编码格式
    file.originalname = Buffer.from(file.originalname, "latin1").toString(
      "utf8"
    );
    callback(null, true);
  },
});

/* 单文件上传 */
// file是文件域的name,必须和前端formdata的key一致
app.post("/upload", upload.single("file"), (req, res) => {
  let msg = {
    body: req.body,
    file: req.file,
    code: 200,
    id: uuidv4(),
  };
  updateJson(msg, path.resolve(__dirname + "/static/relative/index.json"));
  res.json(msg);
});

const sliceObj = {};
// 文件切片上传
app.post("/uploadMulti", async (req, res) => {
  const multipart = new multiparty.Form();
  multipart.parse(req, function (err, filelds, files) {
    // fileds是表单的其他数据
    // files是上传的文件
    const chunk = files.chunk[0];
    const filename = filelds.filename[0];
    const hash = filelds.hash[0];
    const total = filelds.total[0];
    // 临时文件夹路径
    const dir = `${STATIC_TEMPORARY}/${filename}`;


    !sliceObj[filename] && (sliceObj[filename] = {});
    const slicer = sliceObj[filename];
    if (slicer) {
      // 清除上一次的定时器
      clearTimeout(slicer.timmer);
      slicer.timmer = setTimeout(() => {
        console.log('切片上传超时，清空切片');
        Reflect.deleteProperty(sliceObj, filename);
      }, 1000 * 30);
    }

    try {
      // 判断文件夹是否存在,不存在则创建
      if (!fs.existsSync(dir)) fs.mkdirSync(dir);
      // 读取文件流
      const buffer = fs.readFileSync(chunk.path);
      // 写入文件
      const ws = fs.createWriteStream(`${dir}/${hash}`);
      ws.write(buffer);
      ws.close(function(){
        sliceObj[filename].count = (sliceObj[filename].count || 0) + 1;
        if(sliceObj[filename].count === Number(total)){
          console.log("开始合并切片");
          addFile(dir, `${STATIC_FILES}/${filename}`);

          let msg = {
            file: {
              filename,
              path: `${STATIC_FILES}/${filename}`,
            },
            code: 200,
            id: uuidv4(),
          };
          updateJson(msg, path.resolve(__dirname + "/static/relative/index.json"));


          res.send(`${filename} 文件上传成功`);
          console.log("切片合并完成");
          // 重置计数器
          clearTimeout(slicer.timmer);
          Reflect.deleteProperty(sliceObj, filename);
        } else {
          res.send(`${filename}-${hash} 切片上传成功`);
        }
      });
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
      data = JSON.parse(data || "{}");
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
      data = JSON.parse(data || "{}");
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


app.post("/login", (req, res) => {
  const { username, password } = req.body;
  // 同步读取/user/index.json文件
  let data = fs.readFileSync(path.resolve(__dirname + "/user/index.json"));
  // 将读取到的数据转换为json对象
  data = JSON.parse(data || "{}");
  const list = data?.list || [];
  const user = list.find(item => item.username === username);

  if(user){
    if(user.password === password){
      const token = uuidv4();
      user.token = token;
      user.expire = Date.now() + 1000 * 60 * 30;
      // 写入文件
      fs.writeFileSync(
        path.resolve(__dirname + "/user/index.json"),
        JSON.stringify(data, null, 2)
      );

      res.json({
        code: 200,
        msg: "登录成功",
        token,
      });
    } else {
      res.json({
        code: 500,
        msg: "账号/密码错误",
      });
    }
  } else {
    res.json({
      code: 500,
      msg: "账号/密码错误",
    });
  }

});

// 获取token退出登录
app.get("/logout", (req, res) => {
  const { authorization: token } = req.headers;

  // 同步读取/user/index.json文件
  let data = fs.readFileSync(path.resolve(__dirname + "/user/index.json"));
  // 将读取到的数据转换为json对象
  data = JSON.parse(data || "{}");
  const list = data?.list || [];
  const user = list.find(item => item.token === token);

  if (user) {
    user.expire = 0;
    // 写入文件
    fs.writeFileSync(
      path.resolve(__dirname + "/user/index.json"),
      JSON.stringify(data, null, 2)
    );
    res.json({
      code: 200,
      msg: "退出成功",
    });
  } else {
    res.json({
      code: 500,
      msg: "退出失败",
    });
  }
});

// 保存各个罐子的时间
const timeMap = {
  gold: '',
  silver: '',
  copper: '',
};

// 获取各个罐子的时间
app.get("/getTime", (req, res) => {
  res.json({
    code: 200,
    data: timeMap,
  });
});

// 单独更新某个罐子的时间
app.post("/updateTime", (req, res) => {
  const { type, time } = req.body;
  timeMap[type] = time;
  res.json({
    code: 200,
    data: timeMap,
  });
});

// 输出一段html
app.get('/xianyu', (req, res) => {
  // 读取static文件夹下的xianyu.html文件
  fs.readFile(STATIC_FILES + '/xianyu.html', 'utf-8', function (err, data) {
    // 根据html字符串，获取到id分别为gold、silver、copper的元素
    // cheerio是一个类似于jquery的库，可以通过类似于jquery的语法获取到html中的元素
    const $ = cheerio.load(data);

    let now = Date.now();

    let goldLeft = timeMap.gold - now;
    let silverLeft = timeMap.silver - now;
    let copperLeft = timeMap.copper - now;

    let goldText = '';
    let silverText = '';
    let copperText = '';
    if (goldLeft <= 0) goldText = '可收获';
    else goldText = getLeftTime(Math.floor(goldLeft));

    if (silverLeft <= 0) silverText = '可收获';
    else silverText = getLeftTime(Math.floor(silverLeft));

    if (copperLeft <= 0) copperText = '可收获';
    else copperText = getLeftTime(Math.floor(copperLeft));

    // 获取到id为gold的元素，设置其内容为timeMap中gold的值
    $('#gold').html(goldText);
    // 获取到id为silver的元素，设置其内容为timeMap中silver的值
    $('#silver').html(silverText);
    // 获取到id为copper的元素，设置其内容为timeMap中copper的值
    $('#copper').html(copperText);
    // 将修改后的html字符串返回给前端
    res.send($.html());
  });
});



const port = 1111;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

