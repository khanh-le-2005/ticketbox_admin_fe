// api_types.ts
export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string; 
  role: 'TO_CHUC' | 'VAN_HANH' | 'QUET_VE' | 'ADMIN' | string;
  createdAt?: string;
  active?: boolean;
  phone?: string;
  password?: string;
}

export type Company = UserData;
export type Staff = UserData;

export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string;
  fullName: string;
  role: string;
  phone?: string;
}

export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: string;
  phone?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data: UserData[];
}

export const BASE_URL = 'https://api.momangshow.vn/api/auth';