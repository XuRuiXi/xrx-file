
import React, { useRef, useState } from 'react';
import axios from 'axios';
import { Button, message, Space } from 'antd';
import md5 from 'js-md5';

import { TYPES } from '@/utils/constant';

/* 自定义组件 */
import PreviewItem from './components/PreviewItem';

import styles from './FileUpload.less';

const FileUpload = () => {
  const fileRef = useRef(null);
  const [list, setList] = useState([]);
  const [progressList, setProgressList] = useState([]);
  // 解决progressList的闭包问题
  const progressListRef = useRef(progressList);

  const uploadFileChunks = async () => {
    const chunksList = [];
    for (let i = 0; i < list.length; i++) {
      const formData = new FormData();
      formData.append('file', list[i]);
      const buffer = await list[i].slice(0, 100).arrayBuffer();
      const md5Data = md5(buffer);
      formData.append('md5', md5Data);
      chunksList.push(formData);
    }
    
    for (let i = 0; i < chunksList.length; i++) {
      const formData = chunksList[i];
      const md5Data = formData.get('md5');
      const filename = formData.get('file').name;
      const checkResult = await axios.post('/checkFile', { md5: md5Data });
      if (checkResult.data.isExist) {
        progressListRef.current[i] = 100;
        // 更新进度
        setProgressList(progressListRef.current.map(item => item));
        message.info(`${filename}文件已存在`);
      } else {
        const res = await axios.post(
          '/upload',
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const { loaded, total } = progressEvent;
              const percent = Math.floor(loaded / total * 100);
              progressListRef.current[i] = percent;
              // 更新进度
              setProgressList(progressListRef.current.map(item => item));
            },
          },
        );
        if (res.data.code === 200) {
          message.success(`${filename}文件上传成功`);
        } else {
          message.error(`${filename}文件上传失败`);
        }
      }
    }
  };

  const change = e => {
    const files = e.target.files;
    const _file = [];

    // 过滤重复文件
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // 文件类型
      const type = f.name.split('.').pop().toLowerCase();
      // 存在于TYPES中
      const isExist = TYPES.some(item => item === type);
      if (!isExist) {
        message.error(`${f.name}文件类型不支持`);
        continue;
      }

      // 如果文件名已存在，则不添加
      if (list.some(item => item.name === f.name)) {
        message.error(`${f.name}文件已存在`);
        continue;
      }

      _file.push(f);
    }
  
    const mergeList = [...list, ..._file];
    setList(mergeList);
    progressListRef.current = new Array(mergeList.length).fill(undefined);
    // 清空input
    fileRef.current.value = '';
  };

  const del = name => {
    setList(list.filter(item => item.name !== name));
  };

  const clearList = () => {
    setList([]);
    // 清空input
    fileRef.current.value = '';
    // 清空进度
    progressListRef.current = [];
    setProgressList([]);
  };
  
  return (
    <div className={styles.root}>
      <input style={{ display: 'none' }} type="file" ref={fileRef} multiple id="file" onChange={change}/>
      <div>
        <label htmlFor="file">
          <div className={styles.btn}>
            请选择文件
          </div>
        </label>
        <div className={styles.container}>
          {
            list.map((item, index) => {
              return (
                <PreviewItem
                  file={item}
                  progress={progressList[index]}
                  key={item.name}
                  name={item.name}
                  size={item.size}
                  del={del}
                />
              );
            }
            )
          }
        </div>
      </div>
      <Space size="middle">
        <Button onClick={uploadFileChunks} style={{ marginTop: '20px' }}>上传</Button>
        <Button onClick={clearList} style={{ marginTop: '20px' }}>清空列表</Button>
      </Space>
    </div>
  );
};

export default FileUpload;
