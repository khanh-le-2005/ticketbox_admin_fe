import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from "axios";
import { toast } from "react-toastify";

const BASE_URL = "https://api.momangshow.vn/api";

// Cờ đánh dấu đang trong quá trình refresh token
let isRefreshing = false;
// Hàng đợi lưu các request bị lỗi 401 để chạy lại sau khi refresh xong
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/* ================== AXIOS INSTANCE ================== */
const axiosClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/* ================== REQUEST INTERCEPTOR ================== */
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = localStorage.getItem("accessToken");

    // Danh sách API không cần đính token
    const publicEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
    ];

    // Kiểm tra nếu URL hiện tại nằm trong danh sách public
    const isPublic = publicEndpoints.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (accessToken && !isPublic) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ================== RESPONSE INTERCEPTOR ================== */
axiosClient.interceptors.response.use(
  (response) => response.data, // Trả về data trực tiếp cho gọn

  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Nếu lỗi không có response (mất mạng) hoặc không có status
    if (!error.response) {
      toast.error("Lỗi kết nối mạng hoặc Server không phản hồi");
      return Promise.reject(error);
    }

    const status = error.response.status;

    // ⛔ TRƯỜNG HỢP 1: Token hết hạn (401)
    // Theo tài liệu: 401 là token hết hạn/không hợp lệ
    if (status === 401 && !originalRequest._retry) {

      // Nếu là lỗi của chính API refresh-token -> Logout ngay lập tức để tránh lặp
      if (originalRequest.url?.includes("/auth/refresh-token")) {
        return handleLogout("Phiên đăng nhập hết hạn (Refresh Token lỗi)");
      }

      if (isRefreshing) {
        // Nếu đang có tiến trình refresh rồi, thì request này xếp hàng chờ
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        // Gọi API Refresh
        const res = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        // Cấu trúc response tùy backend, đoạn này lấy theo code mẫu của bạn
        const newAccessToken = res.data?.data?.accessToken;
        const newRefreshToken = res.data?.data?.refreshToken;

        if (!newAccessToken) {
          throw new Error("Không lấy được access token mới");
        }

        // Lưu token mới
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // Cập nhật lại header mặc định
        axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Xử lý hàng đợi đang chờ
        processQueue(null, newAccessToken);

        // Gọi lại request ban đầu bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosClient(originalRequest);

      } catch (refreshError) {
        // Nếu refresh thất bại -> Hủy toàn bộ hàng đợi & Logout
        processQueue(refreshError, null);
        return handleLogout("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } finally {
        isRefreshing = false;
      }
    }

    // ⛔ TRƯỜNG HỢP 2: Không có quyền (403) - Ví dụ User vào trang Admin
    if (status === 403) {
      toast.error("Bạn không có quyền truy cập tài nguyên này", {
        toastId: 'error-403' // Ngăn chặn duplicate toast
      });
    }

    return Promise.reject(error);
  }
);

/* ================== LOGOUT HANDLER ================== */
let isLoggingOut = false;

const handleLogout = (message: string) => {
  if (isLoggingOut) return Promise.reject(new Error("Logging out..."));
  isLoggingOut = true;

  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");

  toast.error(message, {
    position: "top-right",
    autoClose: 2000,
  });

  // Đợi 1 chút để user đọc thông báo rồi mới chuyển trang
  setTimeout(() => {
    isLoggingOut = false;
    window.location.href = "/login";
  }, 1500);

  return Promise.reject(new Error(message));
};

export default axiosClient;