// import axiosClient from "@/axiosclient";

// export const dataCheckInCheckOut = ({ params }: {params: any }) => {
//     const res= axiosClient.get(`/hotel-bookings/check-in/search`, { params });
//     return res  
// }   

import axiosClient from "@/axiosclient";

// 1. Định nghĩa Interface cho params để code gợi ý tự động (Intellisense)
export interface CheckInSearchParams {
  keyword: string;
  page?: number; // Dấu ? là tùy chọn
  size?: number;
}

// 2. Viết lại hàm
export const dataCheckInCheckOut = (params: CheckInSearchParams) => {
  return axiosClient.get('/hotel-bookings/check-in/search', {
    params: {
      keyword: params.keyword,
      page: params.page ?? 0,  // Nếu không truyền page, mặc định lấy 0
      size: params.size ?? 10  // Nếu không truyền size, mặc định lấy 10
    }
  });
};