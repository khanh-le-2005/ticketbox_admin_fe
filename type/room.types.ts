// types.ts
export interface RoomTypePayload {
  name: string;
  pricePerNight: number;
  totalRooms: number;
  capacity: number;
}

export interface RoomTypeResponse extends RoomTypePayload {
  code: string; // ID của phòng trả về từ BE
}

// Giả sử API trả về data bọc trong object chuẩn như hình bạn gửi
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// types.ts

// Enum trạng thái phòng như backend
export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  DIRTY = "DIRTY",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED",
}

// Payload đặt phòng
export interface BookingRequestPayload {
  hotelId: string;
  roomTypeCode: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  quantity: number;
  numberOfGuests: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  otp: string;
}

// Thông tin Booking trả về (để Admin quản lý)
export interface BookingResponse {
  id: string;
  customerName: string;
  roomNumber?: string; // Có thể null nếu chưa gán phòng
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  checkInDate: string;
  checkOutDate: string;
}

// Thông tin Phòng (cho Admin Grid view)
export interface RoomData {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomTypeCode: string;
}



// src/type/index.ts

// Cấu trúc loại phòng chi tiết theo JSON mới
export interface RoomTypePayload {
  name: string;
  totalRooms: number;
  standardCapacity: number;
  maxCapacity: number;
  surchargePerPerson: number;
  priceWeekday: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
}

// Cấu trúc data JSON sẽ gửi đi (không còn galleryImageIds)
export interface CreateHotelRequest {
  name: string;
  address: string;
  description: string;
  roomTypes: RoomTypePayload[];
}

// src/types/index.ts

// --- COMMON ---
// export interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

// export interface UploadResponse {
//   id: number;
//   url: string;
//   fileName?: string;
//   fileType?: string;
// }

// // --- ROOM TYPES (Loại phòng) ---
// export interface RoomTypePayload {
//   name: string;
//   pricePerNight: number;
//   totalRooms: number;
//   capacity: number;
// }

// export interface RoomType extends RoomTypePayload {
//   id?: number | string;
//   code?: string;
// }

// // --- HOTEL ---
// export interface Hotel {
//   id: string;
//   name: string;
//   address: string;
//   description?: string;
//   galleryImageIds: number[];
//   images?: UploadResponse[];
//   roomTypes: RoomType[]; // Sử dụng RoomType đã định nghĩa ở trên
//   rating?: number;
//   createdAt?: string;
// }

// export interface CreateHotelRequest {
//   name: string;
//   address: string;
//   description: string;
//   galleryImageIds: number[];
//   roomTypes: RoomTypePayload[];
// }

// export interface UpdateHotelRequest {
//   name?: string;
//   address?: string;
//   description?: string;
//   galleryImageIds?: number[];
//   roomTypes?: RoomTypePayload[];
// }

// // --- PHYSICAL ROOM (Phòng vật lý - Room Instance) ---
// export interface RoomInstancePayload {
//   hotelId: string;
//   roomTypeCode: string;
//   roomNumber: string;
//   floor: number;
// }
