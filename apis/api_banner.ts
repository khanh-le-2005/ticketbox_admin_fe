import axiosClient from '../axiosclient'; 

// =================================================================
// 1. INTERFACE
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
// 2. ADMIN API (Cần Token - axiosClient tự lo)
// =================================================================

export const getAllBanners = async (): Promise<Banner[]> => {
  return await axiosClient.get(ENDPOINT);
};

export const getBannerById = async (id: string): Promise<Banner> => {
  return await axiosClient.get(`${ENDPOINT}/${id}`);
};

export const createBanner = async (banner: Banner): Promise<Banner> => {
  return await axiosClient.post(ENDPOINT, banner);
};

export const updateBanner = async (id: string, banner: Banner): Promise<Banner> => {
  return await axiosClient.put(`${ENDPOINT}/${id}`, banner);
};

export const deleteBanner = async (id: string): Promise<void> => {
  return await axiosClient.delete(`${ENDPOINT}/${id}`);
};

/**
 * Hàm toggle dùng logic PUT để update (Vì Backend chưa có PATCH)
 */
export const toggleBannerStatus = async (id: string, currentBanner: Banner): Promise<Banner> => {
    const updatedData = { ...currentBanner, isActive: !currentBanner.isActive };
    return await updateBanner(id, updatedData);
};

// =================================================================
// 3. PUBLIC API (Dùng cho Client / Hero Section)
// =================================================================

/**
 * Lấy banner hiển thị ra trang chủ.
 * Backend: /api/admin/banners/byMenu (Đã permitAll trong SecurityConfig)
 */
export const getActiveBannersByMenu = async (menu: string): Promise<Banner[]> => {
  try {
    return await axiosClient.get(`${ENDPOINT}/byMenu`, {
      params: { menu }
    });
  } catch (error) {
    console.error("Lỗi lấy banner theo menu:", error);
    // Trả về mảng rỗng để không làm crash trang web nếu lỗi
    return [];
  }
};