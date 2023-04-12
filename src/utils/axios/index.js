import axios from "axios";
const instance = axios.create();
import { message } from "antd";
import { navObj } from "@/index.js";

// 添加baseURL
instance.defaults.baseURL = "/api";

// 设置请求拦截，添加token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 设置响应拦截，如果是500，跳转到登录页面
instance.interceptors.response.use(
  (response) => {
    if (response.data.code === 401) {
      localStorage.removeItem("token");
      navObj.nav("/Mylogin");
      message.error(response.data.msg);
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);


export default instance;