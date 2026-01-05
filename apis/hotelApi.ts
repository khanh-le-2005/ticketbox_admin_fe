import axiosClient from "@/axiosclient"; // Đảm bảo đường dẫn đúng
import { ApiResponse, Hotel, CreateHotelRequest, UpdateHotelRequest } from "@/type";

// Cấu hình URL gốc API để ghép link ảnh
// Dựa trên các request trước, base là: https://api.momangshow.vn/api
const BASE_API_URL = "https://api.momangshow.vn/api";

const hotelApi = {
  getAll: () => axiosClient.get<ApiResponse<Hotel[]>>("/hotels"),

  getById: (id: string) => axiosClient.get<ApiResponse<Hotel>>(`/hotels/${id}`),

  // create: (data: CreateHotelRequest) =>
  //   axiosClient.post<ApiResponse<Hotel>>("/hotels", data),

  update: (id: string, data: UpdateHotelRequest) =>
    axiosClient.put<ApiResponse<Hotel>>(`/hotels/${id}`, data),

  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/hotels/${id}`),

  search: (keyword: string) =>
    axiosClient.get<ApiResponse<Hotel[]>>("/hotels", { params: { keyword } }),

  // =========================================================
  // CẬP NHẬT LOGIC UPLOAD ẢNH THEO YÊU CẦU MỚI
  // =========================================================
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Gọi API POST /images
      // axiosClient đã có interceptor trả về response.data, nên biến 'res' chính là body JSON
      const res: any = await axiosClient.post('/images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Kiểm tra logic nghiệp vụ: success === 200
      if (res.success === 200) {
          const imageId = res.data; // Đây là ID ảnh (string)
          
          // Trả về object chứa cả ID và URL để UI hiển thị ngay lập tức
          return {
              id: imageId,
              url: `${BASE_API_URL}/images/${imageId}` 
          };
      } else {
          throw new Error(res.message || `Upload thất bại với mã lỗi: ${res.success}`);
      }

    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      throw error;
    }
  },

    create: (files: File[], data: CreateHotelRequest) => {
    const formData = new FormData();

    // 1. Append các file ảnh vào key 'images'
    files.forEach((file) => {
      formData.append("images", file);
    });

    // 2. Append dữ liệu JSON vào key 'data' (Dạng String)
    // Content-Type của phần này thường backend tự xử lý là application/json
    formData.append("data", JSON.stringify(data));

    // 3. Gửi Request với header multipart/form-data
    return axiosClient.post<ApiResponse<Hotel>>("/hotels", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Hàm tiện ích: Lấy URL ảnh từ ID (dùng cho list/detail page)
  getImageUrl: (id: string | number | undefined) => {
    if (!id) return 'https://placehold.co/150?text=No+Image';
    const strId = String(id);
    if (strId.startsWith('http')) return strId; // Nếu đã là link full
    return `${BASE_API_URL}/images/${id}`;      // Nếu là ID -> ghép link
  }
};

export default hotelApi;