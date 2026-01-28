import axiosClient from '@/axiosclient';
import { Banner } from '@/type/new.type';

// Re-export Banner type so other files can import it from here
export type { Banner };

const ENDPOINT = '/admin/banners';
// =================================================================
// 2. CÁC HÀM GỌI API (ADMIN)
// =================================================================

export const getAllBanners = async (): Promise<Banner[]> => {
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

// Sửa lại hàm này: Nhận vào banner (đã chứa trạng thái mới) và gọi update
export const toggleBannerStatus = async (id: string, active: boolean): Promise<Banner> => {
  return await axiosClient.patch(`${ENDPOINT}/${id}/status`, null, {
    params: { active }
  });
};

// =================================================================
// 3. CÁC HÀM GỌI API (PUBLIC)
// =================================================================
export const getActiveBannersByMenu = async (menu: string): Promise<Banner[]> => {
  try {
    return await axiosClient.get(`${ENDPOINT}/active-all`, {
      params: { menu }
    });
  } catch (error) {
    console.error(`Error fetching active banners for menu ${menu}:`, error);
    return [];
  }
};