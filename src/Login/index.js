import React, { useRef } from "react";
import { message } from 'antd';
import { useNavigate } from "react-router-dom";
import axios from "@/utils/axios";

const Login = () => {
  // 账号
  const usernameRef = useRef();
  // 密码
  const passwordRef = useRef();
  const navigate = useNavigate();
  const login = () => {
    // 获取账号密码
    const username = usernameRef.current.value;
    const password = passwordRef.current.value;
    // 不能为空
    if (!username || !password) {
      alert("账号或密码不能为空");
      return;
    }
    axios("/login", {
      method: "post",
      data: {
        username,
        password,
      },
    }).then((res) => {
      if (res.data.code === 200) {
        const { token } = res.data;
        localStorage.setItem("token", token);
        navigate("/");
      } else {
        const { msg } = res.data;
        message.error(msg);
      }
      
    });
  };
  return (
    <div>
      账号：<input type="text" ref={usernameRef} defaultValue="admin" />
      <br />
      密码：<input type="password" ref={passwordRef} defaultValue="123456" />
      <br />
      <button onClick={login}>登录</button>
    </div>
  );
};

export default Login;
