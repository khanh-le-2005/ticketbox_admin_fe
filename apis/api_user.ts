import axios from 'axios';
import axiosClient from '../axiosclient';

// =================================================================
// 1. DEFINITIONS & INTERFACES
// =================================================================

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string; 
  role: 'TO_CHUC' | 'VAN_HANH' | 'QUET_VE' | 'ADMIN' | 'KHACH_HANG' | string; // Thêm KHACH_HANG
  createdAt?: string;
  active?: boolean;
  phone?: string;
  password?: string;
  isActive?: boolean; // API trả về active hoặc isActive tùy endpoint
  avatar?: string;
}

export type User = UserData;
export type Company = UserData;
export type Staff = UserData;
// export type Customer = UserData; // Định nghĩa Customer

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  createdAt?: string;
  totalSpent?: number;
  membershipLevel?: string;
}

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

interface ApiResponse {
  success: boolean;
  message: string;
  data: UserData[];
}

const BASE_URL = 'https://api.momangshow.vn/api/auth';

// =================================================================
// 2. HELPER GỌI API AN TOÀN
// =================================================================

export const searchCustomers = async (keyword: string): Promise<Customer[]> => {
    // API tìm kiếm theo email/phone
    // URL: {{base_url}}/api/bookings/search?keyword=0375236179 (Theo yêu cầu của bạn)
    // Nhưng vì đây là quản lý user, có thể bạn muốn tìm user chứ không phải booking?
    // Nếu tìm booking thì sửa thành '/bookings/search'. Dưới đây mình để theo user.
    
    // Nếu bạn muốn tìm user:
    const res: any = await axiosClient.get('/auth/users/search', { params: { keyword } });
    
    // Nếu bạn muốn tìm booking (như ví dụ bạn gửi):
    // const res: any = await axiosClient.get('/bookings/search', { params: { keyword } });
    
    return res.data || res;
};

const getUsersByRole = async (role: string): Promise<UserData[]> => {
  try {
    // Format URL chuẩn: /users?role=VALUE
    const response = await axios.get<ApiResponse>(`${BASE_URL}/users?role=${role.trim()}`);
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) {
        return response.data as any;
    }
    return [];
  } catch (error: any) {
    console.warn(`⚠️ API lấy role '${role}' gặp lỗi:`, error.message);
    return []; 
  }
};

// =================================================================
// 3. CÁC HÀM LẤY DANH SÁCH (READ)
// =================================================================

export const getAllCompanies = async (): Promise<Company[]> => {
  return await getUsersByRole('TO_CHUC');
};

export const getAllStaff = async (): Promise<Staff[]> => {
  const [vanHanh, quetVe] = await Promise.all([
    getUsersByRole('VAN_HANH'),
    getUsersByRole('QUET_VE')
  ]);
  return [...vanHanh, ...quetVe];
};

// --- HÀM MỚI: Lấy danh sách Khách hàng ---
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    // Gọi API endpoint mới: /customers
    const response: any = await axiosClient.get('/customers');
    
    // JSON trả về: { success: true, data: { content: [...] } }
    if (response.data && response.data.content) {
      return response.data.content;
    }
    
    // Fallback phòng trường hợp cấu trúc khác
    if (Array.isArray(response.data)) return response.data;
    
    return [];
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    return [];
  }
};
export const getUserById = async (id: string): Promise<UserData> => {
  try {
    const response = await axios.get(`${BASE_URL}/users/${id}`);
    if (response.data && response.data.data) {
        return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`Lỗi lấy user ${id}:`, error);
    throw error;
  }
};

export const getCompanyById = getUserById;
export const getStaffById = getUserById;

// =================================================================
// 4. CÁC HÀM TẠO - SỬA - XÓA (CUD)
// =================================================================

export const createCompany = async (data: any) => {
  const payload: CreateUserRequest = {
    username: data.username || data.email?.split('@')[0],
    email: data.email,
    password: data.password || '123456',
    fullName: data.name || data.fullName,
    role: 'TO_CHUC',
    phone: data.phone
  };
  return await axios.post(`${BASE_URL}/create-user`, payload);
};

export const createStaff = async (data: any) => {
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

export const updateCompany = async (id: string, data: any) => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: 'TO_CHUC',
    phone: data.phone
  };
  return await axios.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const updateStaff = async (id: string, data: any) => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: data.role,
    phone: data.phone
  };
  return await axios.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const deleteUser = async (id: string) => {
  await axios.delete(`${BASE_URL}/users/${id}`);
};
// ... (Code cũ giữ nguyên)

// =================================================================
// 5. API CHI TIẾT KHÁCH HÀNG & LỊCH SỬ (MOCK DATA)
// =================================================================

interface ApiBookingItem {
  id: number | string;
  bookingCode?: string;
  showName?: string;
  roomName?: string;
  seatInfo?: string;
  bookingDate?: string; // Ngày đặt
  showDate?: string;    // Ngày diễn ra
  checkIn?: string;
  checkOut?: string;
  totalPrice?: number;
  amount?: number;
  status?: string;
  type?: 'TICKET' | 'ROOM'; // Field giả định để phân loại, nếu API không có sẽ xử lý logic khác
}

export interface TicketHistory {
  id: string;
  showName: string;
  bookingDate: string;
  showDate: string;
  seatInfo: string;
  amount: number;
  status: string;
}

export interface RoomBookingHistory {
  id: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  bookingDate: string;
  amount: number;
  status: string;
}

export interface CustomerDetailResponse {
  info: Customer;
  tickets: TicketHistory[];
  rooms: RoomBookingHistory[];
}

/**
 * Hàm lấy chi tiết khách hàng và lịch sử đặt vé/phòng
 * @param id ID của khách hàng (Dùng để lấy Info)
 */
export const getCustomerDetailWithHistory = async (id: string): Promise<CustomerDetailResponse | null> => {
  try {
    // --- BƯỚC 1: Lấy thông tin cá nhân (Profile) ---
    // Cần gọi API user detail vì API history chỉ trả về list vé
    const userInfoPromise = getUserById(id);

    // --- BƯỚC 2: Lấy lịch sử giao dịch ---
    // Lưu ý: Endpoint này là "my-history", thường trả về dữ liệu của người đang đăng nhập (theo Token).
    // Nếu bạn đang dùng quyền Admin để xem lịch sử của User khác, Backend cần hỗ trợ endpoint khác (VD: /bookings/user/{id})
    // hoặc endpoint này phải thông minh. Ở đây tôi gọi đúng URL bạn yêu cầu.
    const historyPromise = axiosClient.get('https://api.momangshow.vn/api/bookings/my-history');

    const [userInfo, historyRes] = await Promise.all([userInfoPromise, historyPromise]);

    // Xử lý dữ liệu History từ JSON
    // Cấu trúc: { success: true, data: { content: [...] } }
    const bookingsData: ApiBookingItem[] = (historyRes.data && historyRes.data.data && historyRes.data.data.content) 
      ? historyRes.data.data.content 
      : [];

    // --- BƯỚC 3: Phân loại Vé và Phòng (Mapping) ---
    const tickets: TicketHistory[] = [];
    const rooms: RoomBookingHistory[] = [];

    bookingsData.forEach((item) => {
      // Logic phân loại: Nếu có checkIn/checkOut hoặc type='ROOM' thì là phòng, ngược lại là vé
      const isRoom = item.type === 'ROOM' || item.roomName || (item.checkIn && item.checkOut);

      const commonStatus = item.status || 'UNKNOWN';
      const commonAmount = item.totalPrice || item.amount || 0;
      const commonDate = item.bookingDate || new Date().toISOString();
      const itemId = item.bookingCode || item.id?.toString();

      if (isRoom) {
        rooms.push({
          id: itemId,
          roomName: item.roomName || item.showName || 'Đặt phòng khách sạn',
          bookingDate: commonDate,
          checkIn: item.checkIn || commonDate,
          checkOut: item.checkOut || commonDate,
          amount: commonAmount,
          status: commonStatus
        });
      } else {
        tickets.push({
          id: itemId,
          showName: item.showName || 'Vé Sự Kiện',
          bookingDate: commonDate,
          showDate: item.showDate || commonDate,
          seatInfo: item.seatInfo || 'N/A',
          amount: commonAmount,
          status: commonStatus
        });
      }
    });

    // Tính tổng chi tiêu từ lịch sử thực tế
    const totalSpentReal = bookingsData.reduce((sum, item) => sum + (item.totalPrice || item.amount || 0), 0);

    // --- BƯỚC 4: Trả về dữ liệu đã gộp ---
    return {
      info: {
        ...userInfo,
        name: userInfo.fullName || userInfo.name || userInfo.username, // Đảm bảo có tên hiển thị
        membershipLevel: userInfo.membershipLevel || 'Thành viên', // Fallback nếu API User chưa có field này
        totalSpent: totalSpentReal // Cập nhật tổng chi tiêu theo thực tế
      },
      tickets: tickets,
      rooms: rooms
    };

  } catch (error) {
    console.error("Lỗi lấy chi tiết khách hàng & lịch sử:", error);
    return null;
  }
  
};
// Hàm xóa khách hàng
export const deleteCustomer = (id: string) => {
    return axiosClient.delete(`/api/customers/${id}`);
};

export const deleteCompany = deleteUser;
export const deleteStaff = deleteUser;