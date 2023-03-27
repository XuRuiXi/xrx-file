import React, { useState, useEffect, useRef } from 'react';
import md5 from 'js-md5';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import styles from './index.less';

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
//       <input type="file" onChange={change} />
//     </div>
//   );
// };

// 图片预览
// const App = () => {
//   const [base64, setBase64] = useState('');
//   const change = e => {
//     // file转base64预览
//     // const file = e.target.files[0];
//     // const fileReader = new FileReader();
//     // fileReader.readAsDataURL(file);
//     // fileReader.onload = e => {
//     //   setBase64(e.target.result);
//     // };

//     // url -> blob映射预览
//     const file = e.target.files[0];
//     const url = URL.createObjectURL(file);
//     setBase64(url);
//   };
//   return (
//     <div className={styles.root}>
//       <input type="file" onChange={change} />
//       <img src={base64} />
//       <iframe src="http://localhost:1111/static/职级评审系统用户手册（参评人版）V3.0.pdf" />
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
const App = () => {
  const SIZE = 1024 * 10; // 10kb
  // 创建切片
  const createFileChunks = function (file, size = SIZE) {
    let fileChunks = [];
    for(let cur = 0; cur < file.size; cur += size){
      fileChunks.push(file.slice(cur, cur + size));
    }
    return fileChunks;
  };

  // 上传切片
  const uploadFileChunks = async function (fileChunks, filename) {
    const total = fileChunks.length;
    const chunksList = fileChunks.map((chunk, index) => {
      let formData = new FormData();
      formData.append('filename', filename);
      formData.append('hash', index);
      formData.append('chunk', chunk);
      formData.append('total', total);
      return {
        formData
      };
    });
    const uploadList = chunksList.map(({
      formData
    }) => axios({
      method: 'post',
      url: 'http://localhost:1111/uploadMulti',
      data: formData
    }));
    await Promise.all(uploadList);
  };

  const change = async e => {
    const file = e.target.files[0];
    const fileChunks = createFileChunks(file);
    await uploadFileChunks(fileChunks, file.name);
  };
  const mergeFileChunks = async function (filename) {
    await axios({
      method: 'get',
      url: 'http://localhost:1111/merge',
      params: {
        filename
      }
    });
  };

  return (
    <div className={styles.root}>
      <input type="file" onChange={change} />
      <button onClick={() => mergeFileChunks('1609743801(1).jpg')}>生成图片</button>
    </div>
  );
};

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


// const App2 = () => {
//   const fileRef = useRef(null);
//   const [fileList, setFileList] = useState([]);
//   const upload = async () => {
//     const file = fileRef.current.files[0];
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
//     getAllFile();
//   };


//   const del = async id => {
//     const delResult = await axios.post('http://localhost:1111/delFile', { id });
//     console.log(delResult);
//     getAllFile();
//   };

//   const getAllFile = async () => {
//     const res = await axios.get('http://localhost:1111/getAllFile');
//     setFileList(res.data);
//   };

//   const preview = url => {
//     // 删除原来的img
//     const img = document.getElementById('img');
//     if (img) {
//       document.body.removeChild(img);
//     }
//     const _img = document.createElement('img');
//     _img.id = 'img';
//     _img.src = url;
//     document.body.appendChild(_img);
//   };
  

//   useEffect(() => {
//     getAllFile();
//   }, []);
//   return (
//     <div className={styles.root}>
//       <input type="file" ref={fileRef} multiple />
//       <button onClick={upload}>上传</button>
//       <div>
//         <div>文件列表</div>
//         <div>
//           {
//             fileList.map(item => (
//               <div key={item.id}>
//                 {item.file.filename}
//                 <button onClick={() => del(item.id)}>删除</button>
//                 <button onClick={() => preview(item.url)}>预览</button>
//               </div>
//             ))
//           }
//         </div>
//       </div>
//     </div>
//   );
// };



createRoot(document.querySelector('#app')).render(<App />);
