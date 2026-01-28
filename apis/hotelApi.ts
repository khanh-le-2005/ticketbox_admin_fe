// import axiosClient from "@/axiosclient"; // Đảm bảo đường dẫn đúng
// import {
//   ApiResponse,
//   Hotel,
//   CreateHotelRequest,
//   UpdateHotelRequest,
//   PageableResponse,
//   ArrivalBooking,
// } from "@/type";
// import { HotelDashboardData } from "@/type/hotel.type";
// import { BASE_API_URL } from "./api_base";
// // const BASE_API_URL = "https://api.momangshow.vn/api";
// const hotelApi = {
//   getAll: () => axiosClient.get<ApiResponse<Hotel[]>>("/hotels"),

//   getById: (id: string) => axiosClient.get<ApiResponse<Hotel>>(`/hotels/${id}`),

//   // create: (data: CreateHotelRequest) =>
//   //   axiosClient.post<ApiResponse<Hotel>>("/hotels", data),

//   update: (id: string, data: UpdateHotelRequest) => {
//     const formData = new FormData();

//     // Quan trọng: Backend Spring Boot thường yêu cầu JSON nằm trong một key (thường là "data" hoặc "request")
//     // và phải được bọc trong Blob với type "application/json" để nó hiểu đây là cấu trúc dữ liệu chứ không phải string thường.

//     formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));

//     // Nếu Backend của bạn dùng tên key khác (ví dụ "hotel", "dto"), hãy đổi chữ "data" ở trên.
//     // Nhưng "data" là key phổ biến nhất trong pattern này.

//     return axiosClient.put(`/hotels/${id}`, formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
//   },


//   delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/hotels/${id}`),

//   search: (keyword: string) =>
//     axiosClient.get<ApiResponse<Hotel[]>>("/hotels", { params: { keyword } }),

//   // =========================================================
//   // CẬP NHẬT LOGIC UPLOAD ẢNH THEO YÊU CẦU MỚI
//   // =========================================================
//   uploadImage: async (file: File) => {
//     const formData = new FormData();
//     formData.append("file", file);

//     try {
//       // Gọi API POST /images
//       // axiosClient đã có interceptor trả về response.data, nên biến 'res' chính là body JSON
//       const res: any = await axiosClient.post("/images", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       if (res.success == 200 || res.success === true) {
//         const imageId = typeof res.data === 'object' ? res.data.id : res.data;
//         return {
//           id: imageId,
//           url: `${BASE_API_URL}/images/${imageId}`,
//         };
//       } else {
//         throw new Error(
//           res.message || `Upload thất bại với mã lỗi: ${res.success}`
//         );
//       }
//     } catch (error) {
//       console.error("Lỗi upload ảnh:", error);
//       throw error;
//     }
//   },

//   create: (files: File[], data: CreateHotelRequest) => {
//     const formData = new FormData();
//     files.forEach((file) => {
//       formData.append("images", file);
//     });
//     formData.append("data", JSON.stringify(data));

//     return axiosClient.post<ApiResponse<Hotel>>("/hotels", formData, {
//       headers: {
//         "Content-Type": "multipart/form-data",
//       },
//     });
//   },

//   // Hàm tiện ích: Lấy URL ảnh từ ID (dùng cho list/detail page)
//   getImageUrl: (id: string | number | undefined) => {
//     if (!id) return "https://placehold.co/150?text=No+Image";
//     const strId = String(id);
//     if (strId.startsWith("http")) return strId; // Nếu đã là link full
//     return `${BASE_API_URL}/images/${id}`; // Nếu là ID -> ghép link
//   },

//   getHotelDashboard: (id: string) => {
//     return axiosClient.get<ApiResponse<HotelDashboardData>>(
//       `/hotels/${id}/dashboard`
//     );
//   },

//   getArrivals: (hotelId: string, date: string, page = 0, size = 20) => {
//     return axiosClient.get<any, { data: PageableResponse<ArrivalBooking> }>("/hotel-bookings/arrivals", {
//       params: {
//         hotelId,
//         date,
//         page,
//         size
//       }
//     });
//   },
//   checkInBooking: (bookingId: string) => {
//     return axiosClient.post(`/hotel-bookings/${bookingId}/check-in`);
//   }
// };

// export default hotelApi;

import axiosClient from "@/axiosclient"; // Đảm bảo đường dẫn đúng
import {
  ApiResponse,
  Hotel,
  CreateHotelRequest,
  UpdateHotelRequest,
  PageableResponse,
  ArrivalBooking,
} from "@/type";
import { HotelDashboardData } from "@/type/hotel.type";
import { BASE_API_URL } from "./api_base";

const hotelApi = {
  getAll: () => axiosClient.get<ApiResponse<PageableResponse<Hotel>>>("/hotels"),

  getById: (id: string) => axiosClient.get<ApiResponse<Hotel>>(`/hotels/${id}`),

  update: (id: string, data: UpdateHotelRequest) => {
    const formData = new FormData();
    formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    return axiosClient.put(`/hotels/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete: (id: string) => axiosClient.delete<ApiResponse<any>>(`/hotels/${id}`),

  search: (keyword: string) =>
    axiosClient.get<ApiResponse<Hotel[]>>("/hotels", { params: { keyword } }),

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res: any = await axiosClient.post("/images", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      if (res.success == 200 || res.success === true) {
        const imageId = typeof res.data === 'object' ? res.data.id : res.data;
        return {
          id: imageId,
          url: `${BASE_API_URL}/images/${imageId}`,
        };
      } else {
        throw new Error(
          res.message || `Upload thất bại với mã lỗi: ${res.success}`
        );
      }
    } catch (error) {
      console.error("Lỗi upload ảnh:", error);
      throw error;
    }
  },

  create: (files: File[], data: CreateHotelRequest) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    formData.append("data", JSON.stringify(data));

    return axiosClient.post<ApiResponse<Hotel>>("/hotels", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getImageUrl: (id: string | number | undefined) => {
    if (!id) return "https://placehold.co/150?text=No+Image";
    const strId = String(id);
    if (strId.startsWith("http")) return strId;
    return `${BASE_API_URL}/images/${id}`;
  },

  getHotelDashboard: (id: string) => {
    return axiosClient.get<ApiResponse<HotelDashboardData>>(
      `/hotels/${id}/dashboard`
    );
  },


  getArrivals: (hotelId: string, date: string, page = 0, keyword = "", size = 20) => {
    return axiosClient.get<any, { data: PageableResponse<ArrivalBooking> }>("/hotel-bookings/arrivals", {
      params: {
        hotelId,
        date,
        page,
        size,
        keyword
      }
    });
  },

  checkInBooking: (bookingId: string, data?: { roomNumbers: string[] }) => {
    return axiosClient.post(`/hotel-bookings/${bookingId}/check-in`, data);
  },

  checkOutBooking: (bookingId: string) => {
    return axiosClient.post(`/hotel-bookings/${bookingId}/check-out`);
  },

  getBookingsByDate: (hotelId: string, createdDate: string, page = 0, size = 20) => {
    return axiosClient.get("/hotel-bookings/by-date", {
      params: { hotelId, createdDate, page, size }
    });
  },

  // =========================================================
  // MỚI: API Lọc tổng quát (Dùng cho cả Created Date và Check-out Date)
  // =========================================================
  filterBookings: (params: {
    hotelId?: string;
    createdFrom?: string;
    createdTo?: string;
    checkInFrom?: string; // Mới thêm
    checkInTo?: string;   // Mới thêm
    checkOutFrom?: string;
    checkOutTo?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }) => {
    return axiosClient.get("/hotel-bookings/filter", { params });
  }
};

export default hotelApi;  