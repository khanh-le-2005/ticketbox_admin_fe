import axios from 'axios';
import { 
  Staff, ApiResponse, 
  CreateUserRequest, UpdateUserRequest, BASE_URL 
} from './api_types'; // Nhớ trỏ đúng đường dẫn file types
export type { Staff } from './api_types'; // Re-export the Staff type for consumers

// --- Helper nội bộ ---
const getUsersByRole = async (role: string): Promise<Staff[]> => {
  try {
    // Lưu ý: url của bạn có thể là /users?role=... hoặc /users/role=... tùy server
    // Ở đây tôi giữ theo logic cũ của bạn
    const response = await axios.get<ApiResponse>(`${BASE_URL}/users?role=${role}`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error: any) {
    console.warn(`⚠️ API lấy role '${role}' gặp lỗi:`, error.message);
    return [];
  }
};

// --- Main Functions ---

export const getAllStaff = async (): Promise<Staff[]> => {
  // Gọi song song cả Vận Hành và Quét Vé
  const taskVanHanh = getUsersByRole('VAN_HANH'); // Lưu ý check lại chuỗi role trên server có dấu cách hay không
  const taskQuetVe = getUsersByRole('QUET_VE');

  const [vanHanh, quetVe] = await Promise.all([taskVanHanh, taskQuetVe]);

  const allStaff = [...vanHanh, ...quetVe];
  
  if (allStaff.length === 0) {
      console.info("Danh sách nhân viên trống.");
  }
  
  return allStaff;
};

export const getStaffById = async (id: string): Promise<Staff> => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${id}`);
    if (response.data && response.data.data) {
        return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`Lỗi lấy nhân viên ${id}:`, error);
    throw error;
  }
};

export const createStaff = async (data: any): Promise<any> => {
  const payload: CreateUserRequest = {
    username: data.username || data.email?.split('@')[0],
    email: data.email,
    password: data.password || '123456',
    fullName: data.name || data.fullName,
    role: data.role || 'VAN_HANH',
    phone: data.phone
  };
  return await axios.post(`${BASE_URL}/create-user`, payload);
};

export const updateStaff = async (id: string, data: any): Promise<any> => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: data.role,
    phone: data.phone
  };
  return await axios.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const deleteStaff = async (id: string): Promise<void> => {
  await axios.delete(`${BASE_URL}/users/${id}`);
};