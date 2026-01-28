export * from "./Show.type";
export * from './room.types';
import { RoomTypePayload } from './room.types';
export * from './article.type';
export * from './auth.type';
export * from './company.type';
export * from './staff.type';
export * from './user.type';


// src/types/index.ts

// --- COMMON ---
export interface ApiResponse<T> {
  success: boolean | number;
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
export interface RoomType extends RoomTypePayload {
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

  // Các trường giá do BE tính toán trả về
  minPrice: number;
  maxPrice: number;
  totalRoomTypes: number;

  roomTypes: RoomType[];
  rating?: number;
  avatarUrl?: string; // Field phụ do FE tự map thêm
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
  keptImageIds?: number[];    // Backend uses this for all images (old + new)
  roomTypes?: RoomTypePayload[];
}

// --- PHYSICAL ROOM (Phòng vật lý - Room Instance) ---
export interface RoomInstancePayload {
  hotelId: string;
  roomTypeCode: string;
  roomNumber: string;
  floor: number;
}