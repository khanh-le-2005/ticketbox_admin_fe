import axios from 'axios';
import { 
  UserData, Company, ApiResponse, 
  CreateUserRequest, UpdateUserRequest, BASE_URL 
} from './api_types'; // Nhớ trỏ đúng đường dẫn file types
export type { Company } from './api_types';

// --- Helper nội bộ ---
const getCompaniesByRole = async (): Promise<Company[]> => {
  try {
    const response = await axios.get<ApiResponse>(`${BASE_URL}/users?role=TO_CHUC`);
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.warn(`⚠️ API lấy TO_CHUC gặp lỗi:`, error.message);
    return [];
  }
};

// --- Main Functions ---

export const getAllCompanies = async (): Promise<Company[]> => {
  return await getCompaniesByRole();
};

export const getCompanyById = async (id: string): Promise<Company> => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${id}`);
    if (response.data && response.data.data) {
        return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`Lỗi lấy công ty ${id}:`, error);
    throw error;
  }
};

export const createCompany = async (data: any): Promise<any> => {
  const payload: CreateUserRequest = {
    username: data.username || data.email?.split('@')[0],
    email: data.email,
    password: data.password || '123456',
    fullName: data.name || data.fullName,
    role: 'TO_CHUC', // Cứng role là TO_CHUC
    phone: data.phone
  };
  return await axios.post(`${BASE_URL}/create-user`, payload);
};

export const updateCompany = async (id: string, data: any): Promise<any> => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: 'TO_CHUC',
    phone: data.phone
  };
  return await axios.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const deleteCompany = async (id: string): Promise<void> => {
  await axios.delete(`${BASE_URL}/users/${id}`);
};