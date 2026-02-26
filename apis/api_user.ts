// import axios from "axios";
import axiosClient from "@/axiosclient";

// =================================================================
// 1. DEFINITIONS & INTERFACES
// =================================================================

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: "TO_CHUC" | "VAN_HANH" | "QUET_VE" | "ADMIN" | "KHACH_HANG" | string; // Thêm KHACH_HANG
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

const BASE_URL = "https://api.momangshow.vn/api/auth";

// =================================================================
// 2. HELPER GỌI API AN TOÀN
// =================================================================

export const searchCustomers = async (keyword: string): Promise<Customer[]> => {
  // API tìm kiếm theo email/phone
  // URL: {{base_url}}/api/bookings/search?keyword=0375236179 (Theo yêu cầu của bạn)
  // Nhưng vì đây là quản lý user, có thể bạn muốn tìm user chứ không phải booking?
  // Nếu tìm booking thì sửa thành '/bookings/search'. Dưới đây mình để theo user.

  // Nếu bạn muốn tìm user:
  const res: any = await axiosClient.get("/auth/users/search", {
    params: { keyword },
  });

  // Nếu bạn muốn tìm booking (như ví dụ bạn gửi):
  // const res: any = await axiosClient.get('/bookings/search', { params: { keyword } });

  return res.data || res;
};

const getUsersByRole = async (role: string): Promise<UserData[]> => {
  try {
    // Format URL chuẩn: /users?role=VALUE
    const response = await axiosClient.get<ApiResponse>(
      `${BASE_URL}/users?role=${role.trim()}`
    );

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
  return await getUsersByRole("TO_CHUC");
};

export const getAllStaff = async (): Promise<Staff[]> => {
  const [vanHanh, quetVe] = await Promise.all([
    getUsersByRole("VAN_HANH"),
    getUsersByRole("QUET_VE"),
  ]);
  return [...vanHanh, ...quetVe];
};

// --- HÀM MỚI: Lấy danh sách Khách hàng ---
export const getAllCustomers = async (): Promise<Customer[]> => {
  try {
    // Gọi API
    const res: any = await axiosClient.get("/customers");

    // Log để debug
    console.log("Customer API Response:", res);

    // Xử lý dữ liệu trả về theo cấu trúc JSON bạn gửi
    // Cấu trúc: { success: true, data: { content: [...] } }

    if (res?.data?.content && Array.isArray(res.data.content)) {
      return res.data.content;
    }

    // Dự phòng các trường hợp khác
    if (res?.content && Array.isArray(res.content)) return res.content;
    if (Array.isArray(res)) return res;

    return [];
  } catch (error) {
    console.error("Lỗi lấy danh sách khách hàng:", error);
    return [];
  }
};
export const getUserById = async (id: string): Promise<UserData> => {
  try {
    const response = await axiosClient.get(`${BASE_URL}/users/${id}`);
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
    username: data.username || data.email?.split("@")[0],
    email: data.email,
    password: data.password || "123456",
    fullName: data.name || data.fullName,
    role: "TO_CHUC",
    phone: data.phone,
  };
  return await axiosClient.post(`${BASE_URL}/create-user`, payload);
};

export const createStaff = async (data: any) => {
  const payload: CreateUserRequest = {
    username: data.username || data.email?.split("@")[0],
    email: data.email,
    password: data.password || "123456",
    fullName: data.name || data.fullName,
    role: data.role || "VAN_HANH",
    phone: data.phone,
  };
  return await axiosClient.post(`${BASE_URL}/create-user`, payload);
};

export const updateCompany = async (id: string, data: any) => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: "TO_CHUC",
    phone: data.phone,
  };
  return await axiosClient.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const updateStaff = async (id: string, data: any) => {
  const payload: UpdateUserRequest = {
    fullName: data.name || data.fullName,
    email: data.email,
    role: data.role,
    phone: data.phone,
  };
  return await axiosClient.put(`${BASE_URL}/create-user/${id}`, payload);
};

export const deleteUser = async (id: string) => {
  await axiosClient.delete(`${BASE_URL}/users/${id}`);
};
// ... (Code cũ giữ nguyên)

// =================================================================
// 5. API CHI TIẾT KHÁCH HÀNG & LỊCH SỬ (MOCK DATA)
// =================================================================

interface CustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipLevel: string | null;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

interface BookingItem {
  id: string;
  requestId?: string;
  showId?: string;
  showName?: string; // Tên show (cho vé)
  hotelName?: string; // Tên khách sạn (cho phòng - giả định)
  totalAmount: number;
  status: string;
  createdAt: string;
  // Field tự thêm ở Frontend để phân loại
  type: "TICKET" | "ROOM";
}

interface ApiHistoryResponse {
  success: boolean;
  message: string;
  data: {
    customerInfo: CustomerInfo;
    showBookings: Omit<BookingItem, "type">[];
    hotelBookings: Omit<BookingItem, "type">[];
  };
}

interface ApiBookingItem {
  id: number | string;
  bookingCode?: string;
  showName?: string;
  roomName?: string;
  seatInfo?: string;
  bookingDate?: string; // Ngày đặt
  showDate?: string; // Ngày diễn ra
  checkIn?: string;
  checkOut?: string;
  totalPrice?: number;
  amount?: number;
  status?: string;
  type?: "TICKET" | "ROOM"; // Field giả định để phân loại, nếu API không có sẽ xử lý logic khác
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

// Backwards-compatible type alias used by components
export type CustomerDetailData = CustomerDetailResponse;

/**
 * Hàm lấy chi tiết khách hàng và lịch sử đặt vé/phòng
 * @param id ID của khách hàng (Dùng để lấy Info)
 */
export const getCustomerDetailWithHistory = async (
  id: string
): Promise<CustomerDetailData | null> => {
  try {
    const res: any = await axiosClient.get(`/customers/${id}/history`);
    const data = res.data || res;

    if (!data || !data.customerInfo) {
      throw new Error("Không có dữ liệu khách hàng");
    }

    // --- 1. Map Show Bookings (Sửa tên biến) ---
    const tickets = (data.showBookings || []).map((item: any) => ({
      id: item.id,
      requestId: item.requestId, // Giữ lại requestId để hiện mã
      showName: item.showName || "Vé sự kiện",

      // 👇 QUAN TRỌNG: Giữ nguyên tên 'createdAt' để UI hiển thị ngày
      createdAt: item.createdAt,

      // 👇 QUAN TRỌNG: Giữ nguyên tên 'totalAmount' để UI hiển thị tiền
      totalAmount: Number(item.totalAmount) || 0,

      status: item.status,
      type: "TICKET" as const,
    }));

    // --- 2. Map Hotel Bookings (Sửa tên biến) ---
    const rooms = (data.hotelBookings || []).map((item: any) => ({
      id: item.id,
      roomName: item.hotelName || "Đặt phòng khách sạn",

      // 👇 Giữ nguyên tên createdAt
      createdAt: item.createdAt,

      // 👇 Giữ nguyên tên totalAmount
      totalAmount: Number(item.totalAmount) || 0,

      status: item.status,
      type: "ROOM" as const,
    }));

    // --- 3. Tính tổng tiền ---
    const totalShowSpent = tickets.reduce(
      (sum: number, item: any) => sum + item.totalAmount,
      0
    );
    const totalHotelSpent = rooms.reduce(
      (sum: number, item: any) => sum + item.totalAmount,
      0
    );
    const totalSpentReal = totalShowSpent + totalHotelSpent;

    // --- 4. Map User Info ---
    const info: Customer = {
      ...data.customerInfo,
      name: data.customerInfo.name || "Chưa đặt tên",
      totalSpent: totalSpentReal,
    };

    return {
      info,
      tickets,
      rooms,
    };
  } catch (error) {
    console.error(`Lỗi lấy lịch sử khách hàng ${id}:`, error);
    return null;
  }
};

// Hàm xóa khách hàng
export const deleteCustomer = (id: string) => {
  return axiosClient.delete(`/customers/${id}`);
};

export const deleteCompany = deleteUser;
export const deleteStaff = deleteUser;
