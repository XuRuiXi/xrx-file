import React, { useState, useEffect } from 'react';
import { Image } from 'antd';
import pdfImg from '@/assets/pdf.png';
import wordImg from '@/assets/word.png';
import videoImg from '@/assets/video.png';
import txtImg from '@/assets/txt.png';
import html from '@/assets/html.png';
import styles from './PreviewItem.less';

// 支持的视频格式
import { VIDEO_LIST, AUDIO_LIST } from '@/utils/constant';

const PreviewItem = (props) => {
  const { name, size, del, file, progress } = props;
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState('');
  // 文件类型
  const fileType = name.split('.').pop();


  // bytes转单位kb, mb, gb
  const formatSize = size => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)}KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)}MB`;
    return `${(size / 1024 / 1024 / 1024).toFixed(2)}GB`;
  };

  useEffect(() => {
    // 如果是pdf和word文件，设置预设的图片
    if (fileType === 'pdf') {
      setSrc(pdfImg);
      return;
    }
    if (fileType === 'doc' || fileType === 'docx') {
      setSrc(wordImg);
      return;
    }
    if (fileType === 'txt') {
      setSrc(txtImg);
      return;
    }
    if (fileType === 'html') {
      setSrc(html);
      return;
    }
    
    if ([...VIDEO_LIST, ...AUDIO_LIST].includes(fileType)) {
      setSrc(videoImg);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = e => {
      setSrc(e.target.result);
    };
  }, [file]);

  return (
    <>
      <div className={styles.root}>
        <img className={styles.img} src={src} alt={name} onClick={() => setVisible(true)}/>
        <span className={styles.name}>{name}</span>
        <span className={styles.size}>{progress !== undefined ? `${progress}%` : formatSize(size)}</span>
        {
          progress === undefined && (
            <button onClick={() => del(name)}>
              删除
            </button>
          )
        }
      </div>
      <Image
        width={200}
        style={{ display: 'none' }}
        preview={{
          visible,
          src,
          onVisibleChange: (value) => {
            setVisible(value);
          },
        }}
      />
    </>

  );
};

export default PreviewItem;
