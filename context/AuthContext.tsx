import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import axios from 'axios';

// Định nghĩa kiểu dữ liệu User khớp với Backend (AuthResponse)
interface User {
  token: string;
  username: string;
  email: string;
  role: string;
  // thêm các trường khác nếu có
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  
  // 1. KHỞI TẠO: Đọc từ localStorage với key 'momang_user'
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('momang_user'); 
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  // 2. HÀM LOGIN (Đã sửa logic bóc tách dữ liệu)
  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      // Gọi trực tiếp axios để tránh vòng lặp interceptor của axiosClient
      const response = await axios.post('https://api.momangshow.vn/api/auth/login', {
         email: email, // Khớp với LoginRequest trong Java
         password: pass
      });

      // Backend trả về: { status: "...", message: "...", data: { token: ... } }
      // Chúng ta cần lấy cái object bên trong `data`
      
      const responseBody = response.data; // Toàn bộ JSON

      if (responseBody && responseBody.data) {
        // Lấy phần lõi (Core Data) chứa Token
        const userData = responseBody.data; 
        
        console.log("Login Success! User Data:", userData);

        // 3. LƯU TOKEN: Lưu phần lõi này vào localStorage
        localStorage.setItem('momang_user', JSON.stringify(userData)); 
        
        setUser(userData);
        return true;
      } else {
        console.error("Cấu trúc phản hồi không đúng:", responseBody);
        return false;
      }

    } catch (error: any) {
      console.error("Login failed:", error.response?.data || error.message);
      return false;
    }
  };

  // 3. HÀM LOGOUT
  const logout = () => {
    localStorage.removeItem('momang_user'); 
    setUser(null);
    // Chuyển hướng về trang login (Optional)
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};