import axiosClient from '../axiosclient'; // <--- SỬA QUAN TRỌNG: Dùng axiosClient
import { BASE_API_URL } from './api_base';

// =================================================================
// 1. INTERFACE
// =================================================================

// Cấu trúc phản hồi từ Backend (Wrapper)
interface UploadResponse {
    success: number;
    data: string; // ID của ảnh
    message: string;
}

// =================================================================
// 2. CÁC HÀM GỌI API
// =================================================================

/**
 * Upload một File ảnh lên Server.
 */
export const uploadImageFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file); 

  try {
    // SỬA: Dùng axiosClient.post thay vì imageApi.post
    // Lưu ý: axiosClient của bạn đã có interceptor trả về response.data
    // nên biến 'res' ở dưới chính là cục data JSON, không cần .data nữa
    
    const res = await axiosClient.post<any, UploadResponse>('/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data', // Bắt buộc cho upload file
      },
    });
    
    // Kiểm tra logic nghiệp vụ (Backend trả về success code 200)
    if (res.success === 200) {
        return res.data; // Trả về ID ảnh
    } else {
        throw new Error(`Upload thất bại: ${res.message}`);
    }

  } catch (error) {
    console.error('Lỗi upload ảnh:', error);
    throw error;
  }
};

/**
 * Tạo URL hiển thị ảnh từ ID
 */
export const getImageUrl = (id: string | number | undefined): string => {
  if (!id) return '';
  
  // Nếu ID đã là link full (trường hợp ảnh cũ hoặc link ngoài) thì giữ nguyên
  const strId = String(id);
  if (strId.startsWith('http')) return strId;

  // Nếu là ID, ghép với đường dẫn API
  return `${BASE_API_URL}/images/${id}`;
};