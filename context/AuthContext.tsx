import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import axiosClient from "@/axiosclient"; // Đảm bảo import đúng đường dẫn

// ================== TYPES ==================
export interface User {
  id?: string;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  phone?: string;
}

interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  phone: string;
}

interface LoginResponse {
  status: string;
  message: string;
  data: AuthResponseData;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// ================== CONTEXT ==================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ================== PROVIDER ==================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Khôi phục user từ localStorage khi load trang
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Lỗi parse user data", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ================== LOGIN ==================
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      // Gọi API Login
      // Lưu ý: axiosClient ở trên response interceptor trả về `response.data`, 
      // nên ở đây biến resData chính là body của json trả về
      const resData = await axiosClient.post<any, LoginResponse>("/auth/login", {
        email,
        password: pass,
      });

      if (!resData?.data?.accessToken) {
        throw new Error(resData.message || "Đăng nhập thất bại (Không có token)");
      }

      // Tách token và thông tin user
      const { accessToken, refreshToken, ...userInfo } = resData.data;

      // Lưu vào LocalStorage
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("user", JSON.stringify(userInfo));

      // Cập nhật State
      setUser(userInfo);
      return true;
    } catch (error: any) {
      // Error message đã được xử lý bởi axios hoặc trả về raw
      const msg = error.response?.data?.message || error.message || "Đăng nhập thất bại";
      throw new Error(msg);
    }
  };

  // ================== LOGOUT ==================
  const logout = () => {
    // Gọi API logout phía backend (fire and forget)
    axiosClient.post("/auth/logout").catch((err) => console.warn("Logout API err:", err));

    // Xóa dữ liệu local
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    setUser(null);

    // Điều hướng về login
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ================== HOOK ==================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};