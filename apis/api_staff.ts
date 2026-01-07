import axiosClient from '../axiosclient';

// --- INTERFACES ---
export interface Staff {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: 'VAN_HANH' | 'QUET_VE';
  active?: boolean;
  createdAt?: string;
  password?: string;
}

// --- API FUNCTIONS ---

// Helper nội bộ để lấy user theo role
const getUsersByRole = async (role: string): Promise<Staff[]> => {
  try {
    // ✅ ĐÚNG: Dùng /auth/users (số nhiều)
    const res: any = await axiosClient.get('/auth/users', {
        params: { role: role }
    });
    if (res.success && res.data) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  } catch (error) {
    console.warn(`⚠️ Lỗi lấy danh sách ${role}`);
    return [];
  }
};

export const getAllStaff = async (): Promise<Staff[]> => {
  const [vanHanh, quetVe] = await Promise.all([
    getUsersByRole('VAN_HANH'),
    getUsersByRole('QUET_VE')
  ]);
  return [...vanHanh, ...quetVe];
};

// Hàm lấy chi tiết nhân viên để đổ vào form sửa
export const getStaffById = async (id: string): Promise<Staff> => {
  // 🟢 CÁCH MỚI: Lấy danh sách rồi tự lọc (Vì API get detail đang lỗi)
  try {
    // 1. Gọi hàm lấy tất cả nhân viên (đã có sẵn ở trên)
    const allStaff = await getAllStaff(); 
    
    // 2. Tìm nhân viên có id trùng khớp
    // (Kiểm tra cả id và _id phòng trường hợp backend trả về khác nhau)
    const staff = allStaff.find((u: any) => u.id === id || u._id === id);

    if (staff) {
      return staff;
    } else {
      throw new Error('Không tìm thấy nhân viên này trong danh sách.');
    }
  } catch (error) {
    console.error("Lỗi tìm nhân viên trong list:", error);
    throw error; // Ném lỗi ra để Component hứng
  }
};

export const createStaff = async (data: any): Promise<any> => {
  const payload = {
    username: data.username || data.email?.split('@')[0],
    email: data.email,
    password: data.password || '123456',
    fullName: data.name || data.fullName,
    role: data.role || 'VAN_HANH',
    phone: data.phone
  };
  return axiosClient.post('/auth/internal/create', payload);
};

const cleanPayload = (obj: any) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([_, v]) => v !== undefined && v !== null && v !== ""
    )
  );


export const updateStaff = async (id: string, data: any) => {
  const payload = cleanPayload({
    fullName: data.fullName || data.name,
    email: data.email,
    phone: data.phone,   // ❗ chỉ gửi khi có
    role: data.role,     // ❗ null thì bị loại
    password: data.password // "" cũng bị loại
  });

  return axiosClient.put(`/auth/users/${id}`, payload);
};


export const deleteStaff = async (id: string): Promise<void> => {
  // ✅ ĐÚNG: Đang dùng users (số nhiều)
  return axiosClient.delete(`/auth/users/${id}`);
};