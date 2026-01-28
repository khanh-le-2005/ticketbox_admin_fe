// api/roomApi.ts
import { RoomInstancePayload, RoomType } from '@/type';
import axiosClient from '../axiosclient'; // Đảm bảo đường dẫn đúng đến file axiosClient của bạn
import { ApiResponse, RoomTypePayload, RoomTypeResponse } from '../type/room.types';

const roomApi = {
  // Lấy danh sách loại phòng của 1 khách sạn
  getRoomTypesByHotel: (hotelId: string) => {
    return axiosClient.get<ApiResponse<RoomType[]>>(`/hotels/${hotelId}/room-types`);
  },

  // Tạo loại phòng mới (Room Type)
  createRoomType: (hotelId: string, data: RoomTypePayload) => {
    return axiosClient.post<ApiResponse<RoomType>>(`/hotels/${hotelId}/room-types`, data);
  },

  // Xóa loại phòng
  deleteRoomType: (hotelId: string, roomCode: string) => {
    return axiosClient.delete<ApiResponse<any>>(`/hotels/${hotelId}/room-types/${roomCode}`);
  },

  // Tạo phòng vật lý (Room Instance - Số phòng, tầng...)
  createRoomInstance: (data: RoomInstancePayload) => {
    return axiosClient.post<ApiResponse<any>>('/hotel-rooms', data);
  },

  getRoomById: (roomId: string) => {
    return axiosClient.get(`/hotel-rooms/${roomId}`);
  },

  // 2. Cập nhật thông tin phòng
  updateRoom: (roomId: string, data: RoomInstancePayload & { status?: string }) => {
    return axiosClient.put(`/hotel-rooms/${roomId}`, data);
  },
  // Lấy danh sách phòng cần dọn dẹp (Dirty)
  getDirtyRooms: (hotelId: string) => {
    return axiosClient.get(`/hotels/${hotelId}/rooms/dirty`);
  },

  // Xác nhận đã dọn phòng (Clean)
  markRoomAsClean: (hotelId: string, roomId: string) => {
    return axiosClient.put(`/hotels/${hotelId}/rooms/${roomId}/clean`);
  },
};

export default roomApi;