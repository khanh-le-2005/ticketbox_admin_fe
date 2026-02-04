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
// ... các phần import và interface giữ nguyên

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Danh sách các role được phép truy cập
  const allowedRoles = ['ADMIN', 'VAN_HANH', 'QUET_VE'];

  useEffect(() => {
    // Khôi phục user từ localStorage khi load trang
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        
        // CẬP NHẬT: Kiểm tra nếu role nằm trong danh sách cho phép
        if (allowedRoles.includes(parsedUser.role)) {
          setUser(parsedUser);
        } else {
          // Nếu không thuộc các role cho phép thì xóa sạch storage
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          setUser(null);
        }
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
      const resData: any = await axiosClient.post("/auth/login", { email, password: pass });

      if (resData.success === false) {
        throw new Error(resData.message);
      }

      const authData = resData.data;

      if (!authData?.access_token) {
        throw new Error(resData.message || "Đăng nhập thất bại");
      }

      const { access_token, refresh_token, ...userInfo } = authData;

      // CẬP NHẬT: Kiểm tra quyền với danh sách ALLOWED_ROLES
      if (! allowedRoles.includes(userInfo.role)) {
        throw new Error("Bạn không có quyền truy cập vào hệ thống này.");
      }

      // Lưu vào LocalStorage
      localStorage.setItem("accessToken", access_token);
      localStorage.setItem("refreshToken", refresh_token);
      localStorage.setItem("user", JSON.stringify(userInfo));

      // Cập nhật State
      setUser(userInfo);
      return true;

    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Đăng nhập thất bại";
      throw new Error(msg);
    }
  };

  // ... các phần logout và return giữ nguyên
  // ================== LOGIN ==================
  // const login = async (email: string, pass: string): Promise<boolean> => {
  //   try {
  //     // Ép kiểu resData thành any để truy cập mọi thuộc tính
  //     const resData: any = await axiosClient.post("/auth/login", { email, password: pass });

  //     if (resData.success === false) {
  //       throw new Error(resData.message);
  //     }

  //     // 1. SỬA Ở ĐÂY: Truy cập vào data và dùng đúng tên access_token
  //     const authData = resData.data; // Lấy object bên trong "data"

  //     if (!authData?.access_token) {
  //       // Nếu không có token, ném message lỗi từ backend (nếu có) hoặc câu mặc định
  //       throw new Error(resData.message || "Đăng nhập thất bại");
  //     }

  //     // 2. Tách dữ liệu từ authData (access_token, refresh_token và các thông tin còn lại)
  //     const { access_token, refresh_token, ...userInfo } = authData;

  //     // 3. Kiểm tra quyền (như bạn đã làm)
  //     const allowedRoles = ['ADMIN', 'VAN_HANH'];
  //     if (!allowedRoles.includes(userInfo.role)) {
  //       throw new Error("Bạn không có quyền truy cập trang quản trị.");
  //     }

  //     // 4. Lưu vào LocalStorage (Lưu ý đổi tên biến khi lưu nếu muốn đồng bộ)
  //     localStorage.setItem("accessToken", access_token);
  //     localStorage.setItem("refreshToken", refresh_token);
  //     localStorage.setItem("user", JSON.stringify(userInfo));

  //     // Cập nhật State
  //     setUser(userInfo);
  //     return true; // Trả về true để LoginPage biết là đã thành công

  //   } catch (error: any) {
  //     // Nếu là lỗi do mình "throw" ở trên, nó sẽ giữ nguyên message
  //     // Nếu là lỗi từ axios (401, 500...), lấy message từ server trả về
  //     const msg = error.response?.data?.message || error.message || "Đăng nhập thất bại";
  //     throw new Error(msg);
  //   }
  // };

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