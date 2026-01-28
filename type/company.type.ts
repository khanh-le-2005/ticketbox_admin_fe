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