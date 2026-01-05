// ✅ SỬA 1: Import axiosClient thay vì axios thường
import axiosClient from '../axiosclient';

// =================================================================
// 1. INTERFACE/TYPES
// =================================================================

export interface Banner {
  id?: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  link: string;
  menu: string;
  displayOrder?: number;
  isActive: boolean;
}

// Đường dẫn gốc khớp với Java Controller: @RequestMapping("/api/admin/banners")
const ENDPOINT = '/admin/banners';

// =================================================================
// 2. CÁC HÀM GỌI API (ADMIN)
// =================================================================

export const getAllBanners = async (): Promise<Banner[]> => {
  // axiosClient đã trả về response.data, nên return trực tiếp
  return await axiosClient.get(ENDPOINT);
};

export const getBannerById = async (id: string): Promise<Banner> => {
  return await axiosClient.get(`${ENDPOINT}/${id}`);
};

export const createBanner = async (bannerData: Banner): Promise<Banner> => {
  return await axiosClient.post(ENDPOINT, bannerData);
};

export const updateBanner = async (id: string, bannerData: Banner): Promise<Banner> => {
  return await axiosClient.put(`${ENDPOINT}/${id}`, bannerData);
};

export const deleteBanner = async (id: string): Promise<void> => {
  return await axiosClient.delete(`${ENDPOINT}/${id}`);
};

// ✅ SỬA 2: Hàm Toggle Status
// Vì Backend Java chỉ có PUT (Update full object), không có PATCH.
// Nên ta phải dùng logic: Lấy object cũ -> Đổi trạng thái -> Gọi hàm Update
export const toggleBannerStatus = async (id: string, currentBanner: Banner): Promise<Banner> => {
  const updatedData = { ...currentBanner, isActive: !currentBanner.isActive };
  return await updateBanner(id, updatedData);
};


// =================================================================
// 3. CÁC HÀM GỌI API (PUBLIC)
// =================================================================

export const getActiveBannersByMenu = async (menu: string): Promise<Banner[]> => {
    try {
        // Gọi endpoint /byMenu (Backend Java đã permitAll cho endpoint này)
        // Path thực tế: /api/admin/banners/byMenu
        return await axiosClient.get(`${ENDPOINT}/byMenu`, { 
            params: { menu } 
        });
    } catch (error) {
        console.error(`Error fetching active banners for menu ${menu}:`, error);
        return []; // Trả về mảng rỗng để không crash trang web
    }
};