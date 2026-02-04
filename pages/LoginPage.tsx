// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError('');
  //   setIsSubmitting(true);

  //   try {
  //     // Gọi API Login
  //     const success = await login(email, password);

  //     if (success) {
  //       // Chuyển hướng
  //       navigate(from, { replace: true });
  //     } else {
  //       setError('Email hoặc mật khẩu không chính xác.');
  //     }
  //   } catch (err: any) {
  //     console.error("Login Error:", err);
  //     const message = err.response?.data?.message || err.message || 'Đăng nhập thất bại.';
  //     setError(message);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password);

      if (success) {
        const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
        if (from === '/') {
          if (['ADMIN', 'VAN_HANH', 'QUET_VE'].includes(savedUser.role)) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          // Nếu user đang cố vào một link cụ thể trước đó, trả họ về link đó
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-pink-500/30 mb-4 rotate-3">
            <HiOutlineLockClosed size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900">Chào mừng trở lại</h1>
          <p className="text-gray-500 mt-2 text-center">Đăng nhập hệ thống momangshow</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm rounded-r-lg flex items-center gap-3">
            <span className="flex-shrink-0 text-lg">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Địa chỉ Email</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors"><HiOutlineMail size={20} /></span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                placeholder="user@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 ml-1">Mật khẩu</label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors"><HiOutlineLockClosed size={20} /></span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-lg shadow-pink-500/30 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang xử lý...
              </>
            ) : 'Đăng Nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;