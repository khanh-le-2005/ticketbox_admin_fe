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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import Swal from "sweetalert2";
import CleanRoomAction from "./CleanRoomAction"; // Component con dọn phòng

// ================= TYPES =================
export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

export interface Booking {
  id: string;
  hotelId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomTypeName: string;
  checkInDate: string; // ISO String
  checkOutDate: string; // ISO String
  status: BookingStatus;
  assignedRoomNumbers: string | null;
  assignedRoomIds?: string | null;
  totalAmount: number;
}

interface RoomData {
  id: string;
  roomNumber: string;
  status: string;
}

interface BookingQueryResponse {
  bookings: Booking[];
  totalPages: number;
  totalElements: number;
}

// ================= API FUNCTIONS =================

// 1. Fetch Bookings (Đã cập nhật xử lý Page)
const fetchBookings = async ({ queryKey }: any): Promise<BookingQueryResponse> => {
  const [_key, filter] = queryKey;
  
  // Gọi API mới hỗ trợ phân trang
  const res = await axiosClient.get("/hotel-bookings/check-in/search", {
    params: {
      keyword: filter.keyword,
      page: filter.page,
      size: filter.size,
    },
  });

  // Backend trả về: ApiResponse < Page < HotelBooking > >
  // Cấu trúc JSON: { data: { content: [...], totalPages: 5, ... } }
  const pageData = res?.data?.data || res?.data;

  return { 
    bookings: pageData?.content || [], // Lấy list từ .content
    totalPages: pageData?.totalPages || 0,
    totalElements: pageData?.totalElements || 0
  };
};

// 2. Fetch Phòng trống
const fetchAssignableRooms = async (bookingId: string): Promise<RoomData[]> => {
  try {
    const res = await axiosClient.get(`/hotel-bookings/${bookingId}/assignable-rooms`);
    // Xử lý linh hoạt data trả về
    return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Error fetching assignable rooms:", error);
    return [];
  }
};

// ================= MAIN COMPONENT =================
const CheckAction: React.FC = () => {
  const queryClient = useQueryClient();

  // State Filter & Pagination
  const [filter, setFilter] = useState({ keyword: "", page: 0, size: 10 }); // Size = 10 khớp với default Controller

  // State UI
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // State cho Check In
  const [assignableRooms, setAssignableRooms] = useState<RoomData[]>([]);
  const [checkInRoomNumber, setCheckInRoomNumber] = useState<string>("");
  const [isLoadingCheckInRooms, setIsLoadingCheckInRooms] = useState(false);

  // === REACT QUERY ===
  const { data, isFetching } = useQuery<BookingQueryResponse>({
    queryKey: ["bookings", filter],
    queryFn: fetchBookings,
    placeholderData: keepPreviousData, // Giữ dữ liệu cũ khi chuyển trang
    staleTime: 5000, 
  });

  const bookings = data?.bookings || [];
  const totalPages = data?.totalPages || 0;

  // === HANDLERS ===

  // Xử lý tìm kiếm (Reset về trang 0)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({ ...filter, keyword: e.target.value, page: 0 });
  };

  // Xử lý chuyển trang
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setFilter({ ...filter, page: newPage });
    }
  };

  // Chọn Booking
  const handleSelectBooking = async (booking: Booking) => {
    setSelectedBooking(booking);
    setCheckInRoomNumber("");
    setAssignableRooms([]);

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

  // API Check In
  const handleCheckIn = async () => {
    if (!selectedBooking || !checkInRoomNumber) return;
    try {
      // Body khớp với DTO ManualCheckInRequest: { roomNumbers: ["301"] }
      await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-in`, {
        roomNumbers: [checkInRoomNumber],
      });
      
      toast.success(`Check-in thành công phòng ${checkInRoomNumber}`);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setSelectedBooking(null);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || "Lỗi Check-in";
      toast.error(msg);
    }
  };

  // API Check Out
  const handleCheckOut = async () => {
    if (!selectedBooking) return;

    const checkOutDate = new Date(selectedBooking.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let warningText = `Khách ${selectedBooking.customerName} - Phòng ${selectedBooking.assignedRoomNumbers}`;

    if (checkOutDate > today) {
      warningText = `⚠️ <b>Khách về sớm</b><br/>(Ngày gốc: ${selectedBooking.checkOutDate})<br/>Bạn chắc chắn muốn trả phòng?`;
    }

    const result = await Swal.fire({
      title: "Xác nhận trả phòng?",
      html: warningText,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Đồng ý trả phòng",
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

  // Component Badge hiển thị trạng thái
  const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
    const styles: Record<string, string> = {
      CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
      CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-200",
      CHECKED_OUT: "bg-amber-100 text-amber-700 border-amber-200",
      CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
    };
    return (
      <span className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100"}`}>
        {status}
      </span>
    );
  };

  // ================= RENDER =================
  return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-1rem)] bg-gray-50 p-2 md:p-4 gap-4 overflow-hidden font-sans text-slate-800">
      <ToastContainer position="top-center" autoClose={2000} />

      {/* --- LEFT PANEL: LIST --- */}
      <div className="w-full lg:w-1/3 lg:min-w-[350px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        
        {/* Header Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              Danh sách
              {isFetching && <span className="text-xs text-blue-500 animate-spin">⏳</span>}
            </h2>
            <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
              {data?.totalElements || 0} đơn
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm tên, SĐT, email..."
              value={filter.keyword}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {bookings.length === 0 && !isFetching && (
            <div className="text-center text-gray-400 mt-10 text-sm">Không tìm thấy dữ liệu.</div>
          )}
          
          {bookings.map((booking) => (
            <div
              key={booking.id}
              onClick={() => handleSelectBooking(booking)}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                selectedBooking?.id === booking.id
                  ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
                  : "bg-white border-gray-100 hover:border-blue-200"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm
                        ${selectedBooking?.id === booking.id ? 'bg-blue-600' : 'bg-slate-400'}`}>
                    {booking.customerName ? booking.customerName.charAt(0).toUpperCase() : "?"}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{booking.customerName || "Khách lẻ"}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {booking.customerPhone}
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium truncate max-w-[150px]">
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

        {/* Footer Pagination */}
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm">
          <button
            onClick={() => handlePageChange(filter.page - 1)}
            disabled={filter.page === 0}
            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
          </button>
          
          <span className="font-medium text-gray-600">
            Trang {filter.page + 1} / {totalPages || 1}
          </span>

          <button
            onClick={() => handlePageChange(filter.page + 1)}
            disabled={filter.page >= totalPages - 1}
            className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* --- RIGHT PANEL: ACTIONS --- */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 overflow-y-auto">
        {!selectedBooking ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
            <DoorOpen size={64} strokeWidth={1} />
            <p className="mt-4 font-medium">Chọn đơn đặt phòng để thao tác</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in">
            {/* Customer Info Header */}
            <div className="mb-6 md:mb-8 text-center">
              <h1 className="text-xl md:text-2xl font-bold text-slate-800">{selectedBooking.customerName}</h1>
              <p className="text-slate-500 text-sm mt-1">{selectedBooking.customerEmail}</p>
              <div className="mt-3 flex justify-center gap-3 text-sm text-slate-600">
                 <span>📅 In: {selectedBooking.checkInDate}</span>
                 <span>📅 Out: {selectedBooking.checkOutDate}</span>
              </div>
              <div className="mt-2"><StatusBadge status={selectedBooking.status} /></div>
            </div>

            {/* === CASE 1: CHECK IN === */}
            {selectedBooking.status === "CONFIRMED" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2">
                  <LogIn className="w-5 h-5" /> Xác nhận Check In
                </h3>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-emerald-900 mb-2">
                    Chọn phòng (Sẵn sàng)
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
                        <option value="">⚠️ Không có phòng trống phù hợp</option>
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
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  XÁC NHẬN CHECK IN
                </button>
              </div>
            )}

            {/* === CASE 2: CHECK OUT === */}
            {selectedBooking.status === "CHECKED_IN" && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-blue-800 font-bold text-lg mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5" /> Xác nhận Trả phòng
                </h3>
                <div className="bg-white p-4 rounded-lg border border-blue-100 mb-5 flex justify-between items-center shadow-sm">
                  <span className="text-slate-500 text-sm font-medium">Phòng đang ở</span>
                  <span className="text-3xl font-bold text-blue-600">{selectedBooking.assignedRoomNumbers}</span>
                </div>
                <button
                  onClick={handleCheckOut}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
                >
                  CHECK OUT & THANH TOÁN
                </button>
              </div>
            )}

            {/* === CASE 3: CLEAN ROOM === */}
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