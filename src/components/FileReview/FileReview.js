import React, { useState, useEffect } from 'react';
import { Image, message, Space, Popconfirm, Button, Modal, Select  } from 'antd';
import { Player } from "video-react";
// video-react样式
import "video-react/dist/video-react.css";
import pdfImg from '@/assets/pdf.png';
import wordImg from '@/assets/word.png';
import txtImg from '@/assets/txt.png';
import axios from '@/utils/axios';

import styles from './FileReview.less';

import { VIDEO_LIST, IMAGE_LIST, AUDIO_LIST, DOC_LIST, TYPES } from '@/utils/constant';

const FileReview = () => {
  const [modal, contextHolder] = Modal.useModal();
  const [fileList, setFileList] = useState([]);
  // 是否开启批量删除
  const [multiple, setMultiple] = useState(false);
  // 批量删除的列表
  const [multipleList, setMultipleList] = useState([]);

  // 显示的文件类型
  const [showType, setShowType] = useState(TYPES);

  const getAllFile = async () => {
    const res = await axios.get('/getAllFile');
    if (Array.isArray(res.data)) setFileList(res.data);
  };

  const del = async id => {
    await axios.post('/delFile', { id });
    getAllFile();
  };

  // 复制文本
  const copyText = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success('复制成功');
    });
  };

  const getFileType = (filename) => {
    const suffix = filename.split('.').pop().toLowerCase();
    return suffix;
  };

  const getImgUrl = (url, type) => {
    if (type === 'pdf') return pdfImg;
    if (type === 'doc' || type === 'docx') return wordImg;
    if (type === 'txt') return txtImg;
    return url;
  };

  const previewPdf = (url) => {
    window.open(url);
  };

  // 下载文件
  const downloadFile = (url, filename) => {
    axios({
      url,
      method: 'GET',
      responseType: 'blob',
    }).then((res) => {
      const blob = new Blob([res.data]);
      if ('download' in document.createElement('a')) {
        const elink = document.createElement('a');
        elink.download = filename;
        elink.style.display = 'none';
        elink.href = URL.createObjectURL(blob);
        document.body.appendChild(elink);
        elink.click();
        URL.revokeObjectURL(elink.href);
        document.body.removeChild(elink);
      } else {
        navigator.msSaveBlob(blob, filename);
      }
    });
  };

  const multipleHandle = () => {
    setMultiple(!multiple);
  };

  const checkboxChange = (e, id) => {
    if (e.target.checked) {
      setMultipleList([...multipleList, id]);
    } else {
      setMultipleList(multipleList.filter(item => item !== id));
    }
  };

  const multipleDel = async () => {
    modal.confirm({
      content: '确认删除吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        for (let i = 0; i < multipleList.length; i++) {
          await axios.post('/delFile', { id: multipleList[i] });
        }
        setMultipleList([]);
        getAllFile();
        setMultiple(false);
      },
    });
  };

  const typeChange = (value) => {
    if (value === '视频') {
      setShowType(VIDEO_LIST);
      return;
    }
    if (value === '图片') {
      setShowType(IMAGE_LIST);
      return;
    }
    if (value === '文档') {
      setShowType(DOC_LIST);
      return;
    }
    if (value === '音频') {
      setShowType(AUDIO_LIST);
      return;
    }
    setShowType(TYPES);
  };

  useEffect(() => {
    getAllFile();
  }, []);
  return (
    <div className={styles.root}>
      <div>
        <Space size="middle">
          <Button
            type="primary"
            onClick={getAllFile}
          >
            刷新
          </Button>
          <Button
            danger
            onClick={multipleHandle}
          >
            {multiple ? '关闭批量删除' : '开启批量删除'}
          </Button>
          {
            multiple && (
              <Button
                danger
                disabled={multipleList.length === 0}
                onClick={multipleDel}
              >
                批量删除
              </Button>
            )
          }
          <Select onChange={typeChange} defaultValue="全部">
            <Select.Option value="全部">全部</Select.Option>
            <Select.Option value="视频">视频</Select.Option>
            <Select.Option value="音频">音频</Select.Option>
            <Select.Option value="图片">图片</Select.Option>
            <Select.Option value="文档">文档</Select.Option>
          </Select>
        </Space>
      </div>
      <div className={styles.container}>
        {
          fileList.filter(item => showType.includes(getFileType(item.file.filename))).map((item) => {
            return (
              <div
                key={item.id}
                className={styles.item}
              >
                {
                  multiple && (
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      onChange={(e) => checkboxChange(e, item.id)}
                    />
                  )
                }
                {
                  [...AUDIO_LIST, ...VIDEO_LIST].includes(getFileType(item.file.filename)) ? (
                    <Player videoId="video-1">
                      <source src={item.url} />
                    </Player>
                  ) : (
                    <Image
                      width={300}
                      height={255}
                      src={getImgUrl(item.url, getFileType(item.file.filename))}
                    />
                  )
                    
                }
                
                <div
                  className={styles.filename}
                  title={item.file.filename}
                >
                文件名称：
                  {item.file.filename}
                </div>
                <div>
                操作：
                  <Space size="middle">
                    <Popconfirm
                      title="确认删除该图片吗？"
                      onConfirm={() => del(item.id)}
                      okText="是"
                      cancelText="否"
                    >
                      <a>删除</a>
                    </Popconfirm>
                    <a onClick={() => copyText(item.url)}>
                    复制url
                    </a>
                    {
                      getFileType(item.file.filename) === 'pdf' && (
                        <a onClick={() => previewPdf(item.url)}>
                          预览pdf
                        </a>
                      )
                    }
                    {
                      getFileType(item.file.filename) === 'txt' && (
                        <a onClick={() => previewPdf(item.url)}>
                          预览txt
                        </a>
                      )
                    }
                    <a onClick={() => downloadFile(item.url, item.file.filename)}>
                      下载文件
                    </a>
                  </Space>
                
                </div>
              </div>
            );
          })
        }
        {
          fileList.length === 0 && (
            <div className={styles.empty}>
              暂无文件
            </div>
          )
        }
        {contextHolder}
      </div>
      
    </div>
  );
};

export default FileReview;