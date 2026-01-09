import axiosClient from "@/axiosclient"; // Đảm bảo import đúng
import { IShow, IShowRequest, ShowListResponse } from "@/type";

// Cấu hình URL ảnh (Nên để riêng file config, nhưng để đây tạm cũng được)
const IMAGE_BASE_URL = "https://api.momangshow.vn/api/images";

export const showApi = {
  // 1. Lấy danh sách Show
  getAllShows: async (params?: any): Promise<IShow[]> => {
    // Gọi: {{base_url}}/shows
    // API có thể trả về một page object (ShowListResponse) hoặc một mảng IShow[] trực tiếp.
    const response = await axiosClient.get<ShowListResponse | IShow[]>(
      "/shows",
      { params }
    );

    const data = response.data as any;
    // Nếu trả về mảng trực tiếp
    if (Array.isArray(data)) return data as IShow[];
    // Nếu trả về page object với content
    if (data && Array.isArray(data.content)) return data.content as IShow[];
    // Fallback
    return [];
  },

  // 2. Lấy chi tiết Show
  getById: async (id: string) => {
    // Gọi: {{base_url}}/shows/{id}
    const response = await axiosClient.get(`/shows/${id}`);
    // Trả về data (axiosClient interceptor thường đã bóc 1 lớp .data rồi)
    return response.data || response;
  },

  // 3. Tạo Show mới (Multipart)
  create: async (data: IShowRequest, files?: File[]) => {
    const formData = new FormData();

    // Chuyển object data thành chuỗi JSON
    // Backend Java: @RequestPart("data")
    formData.append("data", JSON.stringify(data));

    // Append file ảnh
    // Backend Java: @RequestPart("images")
    if (files && files.length > 0) {
      files.forEach((file) => formData.append("images", file));
    }

    // Gửi POST
    // Lưu ý: Token đã có axiosClient lo
    return axiosClient.post("/shows", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 4. Cập nhật Show (Multipart)
  update: async (id: string, data: IShowRequest, files?: File[]) => {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));

    if (files && files.length > 0) {
      files.forEach((file) => formData.append("images", file));
    }

    return axiosClient.put(`/shows/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // 5. Hủy Show (POST)
  cancelShow: async (id: string) => {
    // Gọi: POST {{base_url}}/shows/{id}/cancel
    return axiosClient.post(`/shows/${id}/cancel`);
  },

  // 6. Xóa Show (DELETE - Nếu cần)
  deleteShow: async (id: string) => {
    return axiosClient.delete(`/shows/${id}`);
  },

  // Helper lấy link ảnh
  getImageUrl: (imageId: number | null): string => {
    if (!imageId) return "";
    return `${IMAGE_BASE_URL}/${imageId}`;
  },
};
