import React, { useState, useEffect, useRef } from 'react';
import { Tabs } from 'antd';
import md5 from 'js-md5';
import { createRoot } from 'react-dom/client';
import FileReview from './components/FileReview';
import axios from 'axios';
import styles from './index.less';

const { TabPane } = Tabs;

// 文件上传
// const App = () => {
//   const change = e => {
//     const file = e.target.files[0];
//     const formData = new FormData();
//     formData.append('file', file);
//     axios.post('http://localhost:1111/upload', formData).then(res => {
//       console.log(res);
//     }
//     );
//   };
//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} accept=".jpg,.png" />
//     </div>
//   );
// };

// 多文件上传
// const App = () => {
//   const inputRef = useRef(null);
//   const [list, setList] = useState([]);

//   const uploadFileChunks = async () => {
//     const chunksList = list.map(item => {
//       const formData = new FormData();
//       formData.append('file', item);
//       return formData;
//     });
//     for (let i = 0; i < chunksList.length; i++) {
//       const formData = chunksList[i];
//       await axios.post('http://localhost:1111/upload', formData);
//     }
//   };

//   const change = e => {
//     const files = e.target.files;
//     const _file = [];
//     [...files].forEach(f => {
//       list.some(item => item.name === f.name) || _file.push(f);
//     });
//     setList([...list, ..._file]);
//     // 清空input
//     inputRef.current.value = '';
//   };

//   const del = name => {
//     setList(list.filter(item => item.name !== name));
//   };
//   return (
//     <div className={styles.root}>
//       <input type="file" ref={inputRef} multiple onChange={change} />
//       {
//         list.map(item => {
//           return (
//             <div key={item.name}>
//               {item.name}
//               <button onClick={() => del(item.name)}>删除</button>
//             </div>
//           );
//         }
//         )
//       }
//       <button onClick={uploadFileChunks}>上传</button>
//     </div>
//   );
// };

// 图片/pdf预览
// const App = () => {
//   const [base64, setBase64] = useState('');
//   const [iframeUrl, setIframeUrl] = useState('');
//   const change = e => {
//     // file转base64预览图片
//     // const file = e.target.files[0];
//     // const fileReader = new FileReader();
//     // fileReader.readAsDataURL(file);
//     // fileReader.onload = e => {
//     //   setBase64(e.target.result);
//     // };

//     // url -> blob映射预览(图片/pdf)
//     const file = e.target.files[0];
//     const url = URL.createObjectURL(file);
//     setBase64(url);
//     // setIframeUrl(url);

//     // 生成blob映射之后，通过a标签打开预览
//     // const a = document.createElement('a');
//     // a.href = url;
//     // a.target = '_blank';
//     // a.click();

//     URL.revokeObjectURL(url);

//   };
//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//       <img src={base64} />
//       <iframe src={iframeUrl} />
//     </div>
//   );
// };

// 获取服务器文件流下载
// const App = () => {
//   useEffect(() => {
//     axios.get('http://localhost:1111/download',{
//       responseType: 'blob'
//     }).then(res => {
//       const url = URL.createObjectURL(res.data);
//       const a = document.createElement('a');
//       a.href = url;
//       // 需要预先知道文件名（文件类型）
//       a.download = 'test.png';
//       a.click();
//       URL.revokeObjectURL(url);
//     });
//   }, []);
//   return (
//     <div className={styles.root}></div>
//   );
// };

// 大文件切片上传
// const App = () => {
//   const SIZE = 1024 * 30; // 30kb
//   // 创建切片
//   const createFileChunks = function (file) {
//     const count = file.size;
//     if (count <= SIZE) return [file];
//     const mid = Math.floor(count / 2);
//     const leftContent = file.slice(0, mid);
//     const rightContent = file.slice(mid);
//     return [...createFileChunks(leftContent), ...createFileChunks(rightContent)];
//   };

//   // 上传切片
//   const uploadFileChunks = async function (fileChunks, filename) {
//     const total = fileChunks.length;
//     const chunksList = fileChunks.map((chunk, index) => {
//       let formData = new FormData();
//       formData.append('filename', filename);
//       formData.append('hash', index);
//       formData.append('chunk', chunk);
//       formData.append('total', total);
//       return {
//         formData
//       };
//     });
//     const axiosList = chunksList.map(({
//       formData
//     }) => axios({
//       method: 'post',
//       url: 'http://localhost:1111/uploadMulti',
//       data: formData
//     }));

//     // 限制并发数
//     const concurrencyQuantity = 3;
//     for (let i = 0, len = axiosList.length; i < len; i += concurrencyQuantity) {
//       const list = i + concurrencyQuantity < len ? axiosList.slice(i, i + concurrencyQuantity) : axiosList.slice(i);
//       await Promise.all(list);
//     }
//   };

//   const change = async e => {
//     const file = e.target.files[0];
//     const fileChunks = createFileChunks(file);
//     await uploadFileChunks(fileChunks, file.name);
//   };

//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//     </div>
//   );
// };

// 断点续传
// const App = () => {
//   const [file, setFile] = useState({});
//   const [current, setCurrent] = useState(0);

//   const pauseRef = useRef(false);
//   const [pause, setPause] = useState(false);

//   const change = e => {
//     const _file = e.target.files[0];
//     setFile(_file);
//   };

//   const upload = async file => {
//     const chunkSize = 4000;
//     const url = "http://localhost:1111/upload";
//     const fileSize = file.size;
//     const chunkCount = Math.ceil(fileSize / chunkSize);
//     for (let i = current; i < chunkCount; i+=1) {
//       if (pauseRef.current) return;
//       const start = i * chunkSize;
//       const end = (i + 1) * chunkSize;
//       const chunk = file.slice(start, end);
//       const fd = new FormData();
//       fd.append("file", chunk);
//       await axios.post(url, fd);
//       setCurrent(i + 1);
//     }
//   };

//   const clickPause = () => {
//     pauseRef.current = !pauseRef.current;
//     setPause(pauseRef.current);
//     if (!pauseRef.current) upload(file);
//   };

//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//       <button onClick={() => upload(file)}>上传</button>
//       <button onClick={clickPause}>
//         {pause ? '继续' : '暂停'}
//       </button>
//     </div>
//   );
// };


// 上传进度
// const App = () => {
//   const [file, setFile] = useState({});
//   const [progress, setProgress] = useState(0);

//   const change = e => {
//     const _file = e.target.files[0];
//     setFile(_file);
//   };

//   const upload = async file => {
//     const url = "http://localhost:1111/upload";
//     const fd = new FormData();
//     fd.append("file", file);
//     await axios.post(url, fd, {
//       onUploadProgress: e => {
//         const percent = Math.floor((e.loaded / e.total) * 100);
//         setProgress(percent);
//       }
//     });
//   };

//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//       <button onClick={() => upload(file)}>上传</button>
//       <div className={styles.progress}>
//         {progress}%
//       </div>
//     </div>
//   );
// };


// 拖拽上传
// const App = () => {
//   const dragover = e => {
//     // 阻止默认事件
//     e.preventDefault();
//     // 阻止冒泡
//     e.stopPropagation();
//   };

//   const drop = e => {
//     // 阻止默认事件
//     e.preventDefault();
//     // 阻止冒泡
//     e.stopPropagation();
//     // DataTransfer表示拖放操作中的数据
//     const file = e.dataTransfer.files[0];
//     const formData = new FormData();
//     formData.append('file', file);
//     axios.post('http://localhost:1111/upload', formData).then(res => {
//       console.log(res);
//     }
//     );
//   };

//   return (
//     <div className={styles.root} onDragOver={dragover} onDrop={drop} >
//       请拖到此处上传
//       <input type="file" />
//     </div>
//   );
// };

// 秒传
// const App = () => {
//   const change = async e => {
//     const file = e.target.files[0];
//     const formData = new FormData();
//     formData.append('file', file);
//     const buffer = await file.slice(0, 100).arrayBuffer();
//     const md5Data = md5(buffer);
//     formData.append('md5', md5Data);
//     const checkResult = await axios.post('http://localhost:1111/checkFile', { md5: md5Data });
//     if (checkResult.data.isExist) {
//       console.log('文件已存在');
//       return;
//     }
//     const uploadResult = await axios.post('http://localhost:1111/upload', formData);
//     console.log(uploadResult);
//   };
//   useEffect(() => {
//     axios.get('http://localhost:1111/getAllFile')
//       .then(res => {
//         console.log(res.data);
//       });
//   }, []);
//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//     </div>
//   );
// };


const App = () => {
  const fileRef = useRef(null);
  const [fileList, setFileList] = useState([]);
  const upload = async () => {
    const file = fileRef.current.files[0];
    const formData = new FormData();
    formData.append('file', file);
    const buffer = await file.slice(0, 100).arrayBuffer();
    const md5Data = md5(buffer);
    formData.append('md5', md5Data);
    const checkResult = await axios.post('http://localhost:1111/checkFile', { md5: md5Data });
    if (checkResult.data.isExist) {
      console.log('文件已存在');
      return;
    }
    const uploadResult = await axios.post('http://localhost:1111/upload', formData);
    console.log(uploadResult);
    getAllFile();
  };


  const del = async id => {
    const delResult = await axios.post('http://localhost:1111/delFile', { id });
    console.log(delResult);
    getAllFile();
  };

  const getAllFile = async () => {
    const res = await axios.get('http://localhost:1111/getAllFile');
    setFileList(res.data);
  };

  const preview = url => {
    // 删除原来的img
    const img = document.getElementById('img');
    if (img) {
      document.body.removeChild(img);
    }
    const _img = document.createElement('img');
    _img.id = 'img';
    _img.src = url;
    document.body.appendChild(_img);
  };
  

  useEffect(() => {
    getAllFile();
  }, []);
  return (
    <div className={styles.root}>
      <input type="file" ref={fileRef} multiple />
      <button onClick={upload}>上传</button>
      <div>
        <div>文件列表</div>
        <div>
          {
            fileList.map(item => (
              <div key={item.id}>
                {item.file.filename}
                <button onClick={() => del(item.id)}>删除</button>
                <button onClick={() => preview(item.url)}>预览</button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
};

const items = [
  {
    key: '1',
    label: `文件上传`,
    children: `Content of Tab Pane 1`,
  },
  {
    key: '2',
    label: `文件预览`,
    children: <FileReview />,
  },
];

const Root = () => {
  return (
    <div className={styles.root}>
      <Tabs defaultActiveKey="2" items={items} />
    </div>
  );
};


createRoot(document.querySelector('#app')).render(<Root />);
