
import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = 'https://api.momangshow.vn/api';

const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,

});

// Xử lý dữ liệu trước khi gửi đi (ví dụ: thêm Token)
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const savedUser = localStorage.getItem('momang_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Giả sử server yêu cầu token trong header Authorization
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
  
);

// Xử lý dữ liệu sau khi nhận về từ server
axiosClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Trả về trực tiếp phần dữ liệu chính từ API
    return response.data;
  },
  (error) => {
    // Xử lý các lỗi chung như 401 (Unauthorized), 403 (Forbidden), 500 (Server Error)
    if (error.response && error.response.status === 401) {
      // Ví dụ: tự động logout nếu token hết hạn
      console.warn('Phiên đăng nhập đã hết hạn.');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
