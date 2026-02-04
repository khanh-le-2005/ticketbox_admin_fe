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

/* ================== REFRESH TOKEN LOGIC ================== */
const handleRefreshToken = async (originalRequest: InternalAxiosRequestConfig & { _retry?: boolean }) => {
  // Nếu là lỗi của chính API refresh-token -> Logout ngay lập tức để tránh lặp
  if (originalRequest.url?.includes("/auth/refresh-token")) {
    console.error("AxiosClient: Refresh token API itself failed.");
    return handleLogout("Phiên đăng nhập hết hạn (Refresh Token lỗi)");
  }

  if (isRefreshing) {
    // Nếu đang có tiến trình refresh rồi, thì request này xếp hàng chờ
    console.log("AxiosClient: Refresh already in progress, queuing request...");
    return new Promise(function (resolve, reject) {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return axiosClient(originalRequest);
      })
      .catch((err) => Promise.reject(err));
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const refreshToken = localStorage.getItem("refreshToken");
    console.log("AxiosClient: Starting refresh. Found refreshToken in localStorage:", !!refreshToken);

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    // Gọi API Refresh
    // Lưu ý: Đảm bảo payload khớp với Backend yêu cầu
    const res = await axios.post(`${BASE_URL}/auth/refresh-token`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } }
    );

    // console.log("AxiosClient: Refresh API response:", res.data);
    // console.log("REFRESH STATUS:", res.status);
    // console.log("REFRESH DATA:", res.data);
    // console.log("REFRESH HEADERS:", res.headers);


    // Cấu trúc response tùy backend (Data có thể nằm ở data.data hoặc data)
    const newAccessToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token;
    const newRefreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;

    if (!newAccessToken) {
      console.error("AxiosClient: No access token in refresh response.", res.data);
      throw new Error("Không lấy được access token mới từ phản hồi API");
    }

    console.log("AxiosClient: Refresh success. Updating tokens.");

    // Lưu token mới
    localStorage.setItem("accessToken", newAccessToken);
    if (newRefreshToken) {
      localStorage.setItem("refreshToken", newRefreshToken);
    }

    // Cập nhật lại header mặc định cho instance
    axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

    // Xử lý hàng đợi đang chờ
    processQueue(null, newAccessToken);

    // Gọi lại request ban đầu bị lỗi
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }
    return axiosClient(originalRequest);

  } catch (refreshError: any) {
    console.error("AxiosClient: Refresh failed.", refreshError);
    // Nếu refresh thất bại -> Hủy toàn bộ hàng đợi & Logout
    processQueue(refreshError, null);

    const msg = refreshError?.response?.data?.message || "Phiên đăng nhập đã hết hạn (Lỗi gia hạn)";
    return handleLogout(msg);
  } finally {
    isRefreshing = false;
  }
};

/* ================== RESPONSE INTERCEPTOR ================== */
// axiosClient.interceptors.response.use(
//   async (response) => {
//     // Trả về data trực tiếp
//     const resData = response.data;
//     const originalRequest = response.config as InternalAxiosRequestConfig & { _retry?: boolean };

//     // Dựa vào thông báo: "Token đã hết hạn. Vui lòng đăng nhập lại." hoặc code lỗi trong body
//     if (
//       resData &&
//       (resData.success === false || resData.status === 401) &&
//       (
//         resData.message?.toLowerCase().includes("token") ||
//         resData.message?.toLowerCase().includes("hết hạn") ||
//         resData.message?.toLowerCase().includes("expired") ||
//         resData.message?.includes("phiên đăng nhập")
//       ) &&
//       !originalRequest._retry
//     ) {
//       console.log("AxiosClient: 200 OK but payload says Token expired. Attempting refresh...");
//       return handleRefreshToken(originalRequest);
//     }

//     return resData;
//   },

//   async (error: AxiosError) => {
//     const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

//     // Nếu lỗi không có response (mất mạng) hoặc không có status
//     if (!error.response) {
//       // Chỉ toast nếu không phải là lỗi cancel
//       if (error.code !== "ERR_CANCELED") {
//         toast.error("Lỗi kết nối mạng hoặc Server không phản hồi");
//       }
//       return Promise.reject(error);
//     }

//     const status = error.response.status;
//     const msg = (error.response.data as any)?.message || "";

//     // ⛔ TRƯỜNG HỢP 1: Token hết hạn (401)
//     // Hoặc 403 mà message báo expired (đề phòng backend trả sai status)
//     if (
//       (status === 401 || (status === 403 && msg.toLowerCase().includes("expired"))) &&
//       !originalRequest._retry
//     ) {
//       console.log(`AxiosClient: ${status} detected (Msg: ${msg}). Attempting refresh...`);
//       return handleRefreshToken(originalRequest);
//     }

//     // ⛔ TRƯỜNG HỢP 2: Không có quyền (403) thực sự
//     if (status === 403) {
//       toast.error("Bạn không có quyền truy cập tài nguyên này", {
//         toastId: 'error-403' // Ngăn chặn duplicate toast
//       });
//     }

//     return Promise.reject(error);
//   }
// );
axiosClient.interceptors.response.use(
  (response) => {
    // Luôn trả data
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Không có response (mất mạng)
    if (!error.response) {
      if (error.code !== "ERR_CANCELED") {
        toast.error("Lỗi kết nối mạng hoặc Server không phản hồi");
      }
      return Promise.reject(error);
    }

    const status = error.response.status;
    const msg = ((error.response.data as any)?.message || "").toLowerCase();

    // Nếu lỗi từ API refresh-token → logout luôn
    if (originalRequest.url?.includes("/auth/refresh-token")) {
      return handleLogout("Phiên đăng nhập đã hết hạn");
    }

    // CASE 1: AccessToken hết hạn → REFRESH
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log("AxiosClient: 401 detected → refreshing token");
      return handleRefreshToken(originalRequest);
    }

    // CASE 2: Không có quyền thật sự
    if (status === 403) {
      toast.error("Bạn không có quyền truy cập tài nguyên này", {
        toastId: "error-403",
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


  // Xử lý conflict thư viện toast nếu cần, hoặc dùng alert fallback logic
  try {
    toast.error(message, {
      position: "top-right",
      autoClose: 1500,
    });
  } catch (e) {
    console.error("Toast failed, using alert", e);
    // fallback nếu toast lỗi
  }

  // Đao bảo chuyển trang
  setTimeout(() => {
    isLoggingOut = false;
    // Sử dụng replace để user không back lại được
    window.location.replace("/login");
  }, 1000); // Giảm xuống 1s cho nhanh hơn

  return Promise.reject(new Error(message));
};

export default axiosClient;