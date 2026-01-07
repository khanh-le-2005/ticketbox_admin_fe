import axiosClient from "@/axiosclient"; // Đảm bảo đúng đường dẫn file này
import { IShow, IShowRequest, ShowListResponse } from "@/type";

// Khai báo URL cứng để tránh lỗi mất cấu hình
const API_DOMAIN = "https://api.momangshow.vn/api";

// Hàm Helper nội bộ để lấy token chuẩn string
const getManualToken = (): string => {
  try {
    const json = localStorage.getItem("momang_user");
    if (json) {
      const user = JSON.parse(json);
      // Lấy token và xóa sạch dấu ngoặc kép thừa
      let t = user.token || user.accessToken || "";
      return String(t).replace(/^"|"$/g, "").trim();
    }
  } catch (e) {
    console.error("Lỗi lấy token:", e);
  }
  // Fallback
  const raw = localStorage.getItem("accessToken") || "";
  return String(raw).replace(/^"|"$/g, "").trim();
};

export const showApi = {
  getAllShows: async (params?: any): Promise<IShow[]> => {
    // 🔥 SỬA DÒNG NÀY: Thêm { params } vào axiosClient.get
    const response = await axiosClient.get<ShowListResponse>(
      `${API_DOMAIN}/shows`, 
      { params: params } 
    );
    return response.data.content || [];
  },

  // getById: async (id: string): Promise<IShow | null> => {
  //   try {
  //     const response = await axiosClient.get(`${API_DOMAIN}/shows/${id}`);
  //     return response.data.data;
  //   } catch {
  //     return null;
  //   }
  // },

  getById: async (id: string) => {
    // axiosClient đã xử lý response, nên return luôn kết quả
    return axiosClient.get(`/shows/${id}`);
  },

  // 🔥 SỬA HÀM CREATE: Dùng Full URL để tránh lỗi localhost:3000
  create: async (data: IShowRequest, files: File[]) => {
    const token = getManualToken();
    const formData = new FormData();

    // Backend yêu cầu @RequestPart("data") là JSON string
    formData.append(
      "data",
      new Blob([JSON.stringify(data)], { type: "application/json" })
    );

    files?.forEach((file) => formData.append("images", file));

    return axiosClient.post(`${API_DOMAIN}/shows`, formData, {
      headers: {
        // Bỏ Content-Type để browser tự nhận diện boundary cho FormData
        Authorization: `Bearer ${token}`,
      },
    });
  },
  // 🔥 SỬA HÀM UPDATE: Dùng Full URL
  update: async (id: string, data: IShowRequest, files: File[]) => {
    const token = getManualToken();

    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    files?.forEach((file) => formData.append("images", file));

    return axiosClient.put(`${API_DOMAIN}/shows/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // 🔥 SỬA HÀM CANCEL: Dùng Full URL
cancelShow: async (id: string) => {
    // 1. Lấy Token trực tiếp, không qua trung gian
    const token = getManualToken();

    console.log("🛠️ Đang xóa show ID:", id);
    console.log("🔑 Token dùng để xóa:", token);

    if (!token) {
      alert("LỖI: Không tìm thấy Token. Bạn hãy Đăng xuất rồi Đăng nhập lại!");
      throw new Error("No token");
    }

    // 2. Gửi Request bằng AXIOS GỐC (Bỏ qua axiosClient)
    const response = await axiosClient.post(
      `${API_DOMAIN}/shows/${id}/cancel`, // URL đầy đủ
      {}, // Body rỗng
      {
        headers: {
          "Authorization": `Bearer ${token}`, // Gắn cứng Token
          "Content-Type": "application/json"
        }
      }
    );

    return response.data;
  },

  getImageUrl: (imageId: number | null): string => {
    if (!imageId) return "";
    return `${API_DOMAIN}/images/${imageId}`;
  },
  
};
