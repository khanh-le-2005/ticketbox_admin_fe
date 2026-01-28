import React, { useState } from "react";
import axiosClient from "@/axiosclient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search,
  LogIn,
  LogOut,
  Phone,
  DoorOpen,
  MapPin,
} from "lucide-react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import Swal from "sweetalert2";
import CleanRoomAction from "./CleanRoomAction"; // <--- Import Component con

import { Booking, BookingStatus, BookingResponse } from "./types";

// ================= TYPES (Moved to types.ts) =================
// Booking, BookingStatus imported


interface RoomData {
  id: string;
  roomNumber: string;
  status: string;
}



// ================= API FUNCTIONS =================
const fetchBookings = async ({ queryKey }: any): Promise<BookingResponse> => {
  const [_key, filter] = queryKey;
  const res = await axiosClient.get("/hotel-bookings/check-in/search", {
    params: {
      keyword: filter.keyword,
      page: filter.page,
      size: filter.size,
    },
  });
  return { bookings: res?.data || [] };
};

const fetchAssignableRooms = async (bookingId: string): Promise<RoomData[]> => {
  try {
    const res = await axiosClient.get(`/hotel-bookings/${bookingId}/assignable-rooms`);
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  } catch (error) {
    console.error("Error fetching assignable rooms:", error);
    return [];
  }
};

// ================= MAIN COMPONENT =================
const CheckAction: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [filter, setFilter] = useState({ keyword: "", page: 0, size: 50 });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // State cho Check In
  const [assignableRooms, setAssignableRooms] = useState<RoomData[]>([]);
  const [checkInRoomNumber, setCheckInRoomNumber] = useState<string>("");
  const [isLoadingCheckInRooms, setIsLoadingCheckInRooms] = useState(false);

  // Fetch Data Bookings
  const { data } = useQuery<BookingResponse>({
    queryKey: ["bookings", filter],
    queryFn: fetchBookings,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30,
  });
  const bookings = data?.bookings || [];

  // === HANDLER: CHỌN BOOKING ===
  const handleSelectBooking = async (booking: Booking) => {
    setSelectedBooking(booking);

    // Reset state Check-in
    setCheckInRoomNumber("");
    setAssignableRooms([]);

    // Chỉ load danh sách phòng trống nếu là trạng thái CONFIRMED (Check In)
    // Trạng thái CHECKED_OUT sẽ do CleanRoomAction tự lo
    if (booking.status === "CONFIRMED") {
      setIsLoadingCheckInRooms(true);
      try {
        const rooms = await fetchAssignableRooms(booking.id);
        setAssignableRooms(rooms);
        if (rooms.length > 0) setCheckInRoomNumber(rooms[0].roomNumber);
      } catch (error) {
        toast.error("Không tải được danh sách phòng trống");
      } finally {
        setIsLoadingCheckInRooms(false);
      }
    }
  };

  // === HANDLER: CHECK IN ===
  const handleCheckIn = async () => {
    if (!selectedBooking || !checkInRoomNumber) return;
    try {
      await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-in`, {
        roomNumbers: [checkInRoomNumber],
      });
      toast.success(`Check-in thành công phòng ${checkInRoomNumber}`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedBooking(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Lỗi Check-in");
    }
  };

  // === HANDLER: CHECK OUT ===
  const handleCheckOut = async () => {
    if (!selectedBooking) return;

    const checkOutDate = new Date(selectedBooking.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let warningText = `Khách ${selectedBooking.customerName} - Phòng ${selectedBooking.assignedRoomNumbers}`;

    // Kiểm tra check-out sớm
    if (checkOutDate > today) {
      warningText = `⚠️ <b>Khách check-out sớm hơn dự kiến</b><br/>
                       (Ngày về gốc: ${selectedBooking.checkOutDate}, Hôm nay: ${today.toISOString().split('T')[0]})<br/><br/>
                       Hệ thống sẽ mở bán lại phòng cho các đêm còn thừa. Bạn có chắc chắn không?`;
    }

    const result = await Swal.fire({
      title: "Xác nhận trả phòng?",
      html: warningText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý",
    });

    if (result.isConfirmed) {
      try {
        await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-out`);
        toast.success("Trả phòng thành công!");
        queryClient.invalidateQueries({ queryKey: ["bookings"] });
        setSelectedBooking(null);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Lỗi Check-out");
      }
    }
  };

  // Helper Badge
  const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    const styles = {
      CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
      CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-200",
      CHECKED_OUT: "bg-amber-100 text-amber-700 border-amber-200",
      CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
    };
    return (
      <span className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-1rem)] bg-gray-50 p-2 md:p-4 gap-4 overflow-x-hidden lg:overflow-hidden font-sans text-slate-800">
      <ToastContainer position="top-center" autoClose={2000} aria-label="Toast Container" />

      {/* LEFT PANEL: LIST BOOKING */}
      <div className="w-full lg:w-1/3 lg:min-w-[350px] max-h-[50vh] lg:max-h-none bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {/* ... (Phần List Booking giữ nguyên) ... */}
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            Danh sách đặt phòng
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm tên, SĐT..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={(e) => setFilter({ ...filter, keyword: e.target.value })}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => handleSelectBooking(booking)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedBooking?.id === booking.id
                ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
                : "bg-white border-gray-100 hover:border-blue-200"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm
                        ${selectedBooking?.id === booking.id ? 'bg-blue-600' : 'bg-slate-400'}`}>
                    {booking.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900">{booking.customerName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {booking.customerPhone}
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">
                  {booking.roomTypeName}
                </span>
                {booking.assignedRoomNumbers && (
                  <span className="flex items-center gap-1 font-bold text-slate-700">
                    <MapPin className="w-3 h-3" /> P.{booking.assignedRoomNumbers}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: ACTIONS */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 overflow-y-auto">
        {!selectedBooking ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <DoorOpen size={64} strokeWidth={1} />
            <p className="mt-4">Chọn đơn đặt phòng để thao tác</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6 md:mb-8 text-center">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">{selectedBooking.customerName}</h1>
              <p className="text-slate-500 text-sm mt-1">{selectedBooking.customerEmail}</p>
              <div className="mt-2"><StatusBadge status={selectedBooking.status} /></div>
            </div>

            {/* CASE 1: CHECK IN */}
            {selectedBooking.status === "CONFIRMED" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-emerald-800 font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                  <LogIn className="w-5 h-5" /> Xác nhận Check In
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Chọn phòng (Available)
                  </label>
                  {isLoadingCheckInRooms ? (
                    <div className="p-3 text-sm text-emerald-600 animate-pulse bg-emerald-100 rounded-lg">Đang tải danh sách phòng...</div>
                  ) : (
                    <select
                      className="w-full p-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 font-medium cursor-pointer"
                      value={checkInRoomNumber}
                      onChange={(e) => setCheckInRoomNumber(e.target.value)}
                    >
                      {assignableRooms.length === 0 ? (
                        <option value="">Không có phòng phù hợp</option>
                      ) : (
                        assignableRooms.map(room => (
                          <option key={room.id} value={room.roomNumber}>
                            Phòng {room.roomNumber} ({room.status})
                          </option>
                        ))
                      )}
                    </select>
                  )}
                </div>

                <button
                  onClick={handleCheckIn}
                  disabled={!checkInRoomNumber || assignableRooms.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  XÁC NHẬN CHECK IN
                </button>
              </div>
            )}

            {/* CASE 2: CHECK OUT */}
            {selectedBooking.status === "CHECKED_IN" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-blue-800 font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5" /> Xác nhận Trả phòng
                </h3>
                <div className="bg-white p-4 rounded-lg border border-blue-100 mb-5 flex justify-between items-center">
                  <span className="text-slate-500 text-sm">Phòng đang ở</span>
                  <span className="text-2xl font-bold text-blue-600">{selectedBooking.assignedRoomNumbers}</span>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                >
                  CHECK OUT
                </button>
              </div>
            )}

            {/* CASE 3: CLEAN ROOM (ĐÃ TÁCH COMPONENT) */}
            {selectedBooking.status === "CHECKED_OUT" && (
              <CleanRoomAction
                booking={selectedBooking}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["bookings"] });
                  setSelectedBooking(null);
                }}
              />
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default CheckAction;