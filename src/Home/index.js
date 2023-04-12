import React from "react";
import { Tabs } from "antd";
import FileReview from '../components/FileReview';
import FileUpload from '../components/FileUpload';

import axios from '@/utils/axios';

import { navObj } from '../index';

const items = [
  {
    key: '1',
    label: `文件上传`,
    children: <FileUpload />,
  },
  {
    key: '2',
    label: `文件预览`,
    children: <FileReview />,
  },
];

const logout = () => {
  axios.get('/logout').then(res => {
    if (res.data.code === 200) {
      navObj.nav('/Mylogin');
      // 清除token
      localStorage.removeItem('token');
    }
  });
};



const Home = () => {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          padding: '10px 20px',
        }}
      >
        <a
          onClick={logout}
          style={{
            color: '#fff',
            backgroundColor: '#1890ff',
            padding: '5px 10px',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          退出登录
        </a>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default Home;
