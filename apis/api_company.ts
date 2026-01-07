import axiosClient from "../axiosclient";

// --- INTERFACES ---
export interface Company {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role?: "TO_CHUC"; // Cố định role
  active?: boolean;
  createdAt?: string;
  password?: string; // Dùng khi tạo mới
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// --- API FUNCTIONS ---

export const getAllCompanies = async (): Promise<Company[]> => {
  const res: any = await axiosClient.get("/auth/users", {
    params: { role: "TO_CHUC" },
  });
  return res.data || res;
};

// api_company.ts

export const getCompanyById = async (id: string): Promise<Company> => {
  try {
    // Gọi hàm lấy danh sách ở trên
    const allCompanies = await getAllCompanies();
    
    // Tìm phần tử có id khớp
    const company = allCompanies.find((u: any) => u.id === id);

    if (company) {
      return company;
    } else {
      throw new Error('Không tìm thấy dữ liệu công ty này trong danh sách.');
    }
  } catch (error) {
    console.error("Lỗi getCompanyById:", error);
    throw error;
  }
};

export const createCompany = async (data: any) => {
  const payload = {
    fullName: data.name || data.fullName,
    username: data.username,
    email: data.email,
    password: data.password,
    role: "TO_CHUC",
    phone: data.phone, // Luôn gửi chuỗi rỗng để tránh Null
  };
  return axiosClient.post("/auth/internal/create", payload);
};


export const updateCompany = async (id: string, data: any) => {
  const payload = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: 'TO_CHUC',
    
    // 👇 QUAN TRỌNG: Backend bị lỗi so sánh null, ta phải gửi chuỗi rỗng ""
    // Nếu data.phone là null/undefined -> gửi ""
    phone: data.phone ? data.phone : "", 
    
    username: data.username
  };
  
  // Dùng PUT vào đường dẫn số nhiều (users)
  return axiosClient.put(`/auth/users/${id}`, payload);
};

export const deleteCompany = async (id: string) => {
  return axiosClient.delete(`/auth/users/${id}`);
};
