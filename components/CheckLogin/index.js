import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 传入一个页面，判断是否登录，如果没有登录，跳转到登录页面
const CheckLogin = (props) => {
  const { Page } = props;
  const isLogin = localStorage.getItem("token");
  const navigate = useNavigate();
  useEffect(() => {
    if (!isLogin) navigate("/Mylogin");
  }, []);

  if (isLogin) return Page;
  return null;
};

export default CheckLogin;