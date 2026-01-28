// types.ts

export interface RoomTypePayload {
  name: string;
  totalRooms: number;
  standardCapacity: number;
  maxCapacity: number;
  surchargeSunToThu: number;
  surchargeFriSat: number;
  surchargePerPerson: number;
  priceMonToThu: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
  code?: string;
  id?: string;
}

export interface RoomTypeResponse extends RoomTypePayload {
  code: string;
}

export interface ApiResponse<T> {
  success: boolean | number;
  message: string;
  data: T;
}

export enum RoomStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
  DIRTY = "DIRTY",
  MAINTENANCE = "MAINTENANCE",
  RESERVED = "RESERVED",
}

export interface BookingRequestPayload {
  hotelId: string;
  roomTypeCode: string;
  checkInDate: string;
  checkOutDate: string;
  quantity: number;
  numberOfGuests: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  otp: string;
}

export interface BookingResponse {
  id: string;
  customerName: string;
  roomNumber?: string;
  status: "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
  checkInDate: string;
  checkOutDate: string;
}

export interface RoomData {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomTypeCode: string;
}

export interface ArrivalBooking {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  hotelName: string;
  roomTypeName: string;
  roomNumber: string | null;
  quantity: number;
  checkInDate: string;
  checkOutDate: string;
  status: "CONFIRMED" | "CHECKED_IN" | "CANCELLED";
  totalAmount: number;
}

export interface PageableResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface RoomTypeState {
  name: string;
  totalRooms: number;
  standardCapacity: number;
  maxCapacity: number;
  priceMonToThu: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
  surchargeSunToThu: number;
  surchargeFriSat: number;
}

export interface RoomInstance {
  id: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  roomTypeCode: string;
  roomTypeName: string;
  createdAt: string;
}

export interface DashboardGroup {
  count: number;
  rooms: { id: string; roomNumber: string }[];
}

export interface DashboardData {
  available: DashboardGroup;
  occupied: DashboardGroup;
  dirty: DashboardGroup;
  maintenance: DashboardGroup;
}
