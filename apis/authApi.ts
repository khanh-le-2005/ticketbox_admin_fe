import axiosClient from "../axiosclient";
import { ApiResponse } from "@/type"; // Đảm bảo bạn có type ApiResponse chung
import { UserSummary, AuthResponse, RefreshTokenRequest } from "@/type/auth.type";

// --- INTERFACES ---


const authApi = {
  /**
   * Lấy thông tin người dùng hiện tại
   * GET /api/auth/me
   */
  getMe: () => {
    return axiosClient.get<ApiResponse<UserSummary>>('/auth/me');
  },

  /**
   * Đăng xuất
   * POST /api/auth/logout
   */
  logout: () => {
    return axiosClient.post<ApiResponse<void>>('/auth/logout');
  },

  /**
   * Cấp lại Token mới (Refresh Token)
   * POST /api/auth/refresh-token
   */
  refreshToken: (data: RefreshTokenRequest) => {
    return axiosClient.post<ApiResponse<AuthResponse>>('/auth/refresh-token', data);
  },

  // ... (giữ lại hàm login/register cũ của bạn nếu có)
  login: (credentials: any) => {
    return axiosClient.post('/auth/login', credentials);
  }
};

export default authApi;