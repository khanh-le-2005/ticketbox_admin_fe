export * from "./Show.type";
export * from './room.types';


// src/types/index.ts

// --- COMMON ---
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UploadResponse {
  id: number;
  url: string;
  fileName?: string;
  fileType?: string;
}

// --- ROOM TYPES (Loại phòng) ---
export interface RoomTypePayload {
  name: string;
  pricePerNight: number;
  totalRooms: number;
  capacity: number;
}

export interface RoomType extends RoomTypePayload {
  id?: number | string;
  code?: string;
}

// --- HOTEL ---
export interface Hotel {
  id: string;
  name: string;
  address: string;
  description?: string;
  galleryImageIds: number[]; 
  images?: UploadResponse[];
  roomTypes: RoomType[]; // Sử dụng RoomType đã định nghĩa ở trên
  rating?: number;
  createdAt?: string;
}

export interface CreateHotelRequest {
  name: string;
  address: string;
  description: string;
  galleryImageIds: number[];
  roomTypes: RoomTypePayload[];
}

export interface UpdateHotelRequest {
  name?: string;
  address?: string;
  description?: string;
  galleryImageIds?: number[];
  roomTypes?: RoomTypePayload[]; 
}

// --- PHYSICAL ROOM (Phòng vật lý - Room Instance) ---
export interface RoomInstancePayload {
  hotelId: string;
  roomTypeCode: string;
  roomNumber: string;
  floor: number;
}



export interface RoomType {
  code?: string;
  name: string;
  totalRooms: number;
  
  // Các trường mới
  standardCapacity: number;
  maxCapacity: number;
  surchargePerPerson: number;
  priceWeekday: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
}

export interface Hotel {
  id: string;
  name: string;
  address: string;
  description?: string;
  galleryImageIds: number[];
  
  // Các trường giá do BE tính toán trả về
  minPrice: number;
  maxPrice: number;
  totalRoomTypes: number;
  
  roomTypes: RoomType[];
  rating?: number;
  avatarUrl?: string; // Field phụ do FE tự map thêm
}