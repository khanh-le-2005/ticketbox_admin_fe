export interface Address {
  specificAddress: string;
  ward: string;
  district: string;
  province: string;
  fullAddress?: string; // Response trả về, Request không cần
  latitude: number;
  longitude: number;
}

export interface TicketType {
  code: string;
  name: string;
  description?: string;
  price: number;
  totalQuantity: number;
  // Các trường response trả về thêm
  availableQuantity?: number;
  lockedQuantity?: number;
  realAvailable?: number;
}

export interface Organizer {
  id: string;
  name: string;
  email: string;
}

// Interface dùng cho danh sách hiển thị (Response)
export interface IShow {
  id: string;
  name: string;
  description: string;
  bannerImageId: number | null;
  galleryImageIds: number[];
  address: Address;
  startTime: string; // Response trả về có chữ T (ISO)
  endTime?: string;
  status: string;
  ticketTypes: TicketType[];
  performers: string[]; // 🔥 SỬA: Mảng chuỗi (String Array)
  organizer: Organizer;
  deleted: boolean;
  version: number;
}

// Interface dùng để Gửi đi (Request Payload)
// export interface IShowRequest {
//   name: string;
//   description: string;
//   genre: string;
//   startTime: string; // 🔥 QUAN TRỌNG: Format "yyyy-MM-dd HH:mm:ss"
//   endTime: string; // 🔥 QUAN TRỌNG: Format "yyyy-MM-dd HH:mm:ss"
//   address: Address;
//   performers: string[]; // 🔥 SỬA: Gửi mảng chuỗi ["Sơn Tùng"]
//   ticketTypes: TicketType[];
//   companyId: string;
// }

// Wrapper Response chuẩn
type sortType = { sorted: boolean; empty: boolean; unsorted: boolean };
export interface ShowListResponse {
  content: IShow[];
  // ... paging info
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: sortType;
    offset: number;
  };
  size: number;
  sort: sortType;
  totalElements: number;
  totalPages: number;
}

// src/type/index.ts (hoặc file type tương ứng)

export interface IShowRequest {
  name: string;
  description: string;
  genre: string;
  startTime: string;
  endTime: string;
  address: {
    specificAddress: string;
    ward: string;
    district: string;
    province: string;
    fullAddress?: string;
    latitude?: number;
    longitude?: number;
  };
  performers: string[];
  
  // 👇 THÊM TRƯỜNG NÀY
  keepGalleryImageIds?: number[]; 
  
  ticketTypes: {
    code: string; // Có thể rỗng
    name: string;
    description: string;
    price: number;
    totalQuantity: number;
  }[];
  companyId: string;
}