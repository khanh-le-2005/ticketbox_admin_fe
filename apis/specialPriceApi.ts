// api/specialPriceApi.ts
import axiosClient from '@/axiosclient'; // Đường dẫn import axiosClient của bạn

// Định nghĩa kiểu dữ liệu dựa trên JSON bạn cung cấp
export interface SpecialPrice {
  id: string;
  hotelId: string;
  roomTypeCode: string;
  date: string;        // <-- API trả về "date", không phải "fromDate/toDate"
  price: number;
  surcharge: number;
  note: string;
}

// Kiểu dữ liệu khi tạo mới/cập nhật (thường không có id)
export type SpecialPricePayload = Omit<SpecialPrice, 'id'>;

const specialPriceApi = {
  // GET: Lấy danh sách giá đặc biệt theo Hotel ID
  getByHotelId: (hotelId: string) => {
    return axiosClient.get<SpecialPrice[]>(`/hotels/${hotelId}/special-prices`);
  },

  // POST: Tạo mới giá đặc biệt
  create: (data: SpecialPricePayload) => {
    return axiosClient.post('/hotels/special-prices', data);
  },

  // PUT: Cập nhật giá đặc biệt
  update: (id: string, data: SpecialPricePayload) => {
    return axiosClient.put(`/hotels/special-prices/${id}`, data);
  },

  // DELETE: Xóa giá đặc biệt
  delete: (id: string) => {
    return axiosClient.delete(`/hotels/special-prices/${id}`);
  },
};

export default specialPriceApi;