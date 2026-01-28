export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export interface Booking {
  id: string;
  hotelId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: BookingStatus;
  assignedRoomNumbers: string | null;
  assignedRoomIds?: string | null;
  totalAmount: number;
}

export interface AssignableRoom {
  id: string;
  roomNumber: string;
  status: string;
}

export interface BookingResponse {
  bookings: Booking[];
}