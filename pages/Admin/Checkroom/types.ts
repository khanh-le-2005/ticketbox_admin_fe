export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

export interface Booking {
    id: string;
    hotelId: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    roomTypeName: string;
    status: BookingStatus;
    assignedRoomNumbers?: string | null;
    assignedRoomIds?: string | null;
    checkInDate: string;
    checkOutDate: string;
}

export interface BookingResponse {
    bookings: Booking[];
}
