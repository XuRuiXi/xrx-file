const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();

//设置跨域访问
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1');
  res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.use(bodyParser.json());

app.post('/upload', (req, res) => {
  res.send(JSON.stringify({
    code: 'SUCCESS',
  }));
});

app.get('/download', (req, res) => {
  const cs = fs.createReadStream(__dirname + '/../src/assets/blob.png');
  cs.on("data", chunk => {
    res.write(chunk);
  });
  cs.on("end", () => {
    res.status(200);
    res.end();
  });
});





const port = 1111;
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
