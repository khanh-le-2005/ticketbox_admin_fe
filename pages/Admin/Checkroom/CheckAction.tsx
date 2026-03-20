// import React, { useState } from "react";
// import axiosClient from "@/axiosclient";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import {
//   Search,
//   LogIn,
//   LogOut,
//   Phone,
//   DoorOpen,
//   MapPin,
//   ChevronLeft,
//   ChevronRight,
// } from "lucide-react";
// import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
// import Swal from "sweetalert2";
// import CleanRoomAction from "./CleanRoomAction"; // Component con dọn phòng

// // ================= TYPES =================
// export type BookingStatus = "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

// export interface Booking {
//   id: string;
//   hotelId: string;
//   customerName: string;
//   customerPhone: string;
//   customerEmail: string;
//   roomTypeName: string;
//   checkInDate: string; // ISO String
//   checkOutDate: string; // ISO String
//   status: BookingStatus;
//   assignedRoomNumbers: string | null;
//   assignedRoomIds?: string | null;
//   totalAmount: number;
// }

// interface RoomData {
//   id: string;
//   roomNumber: string;
//   status: string;
// }

// interface BookingQueryResponse {
//   bookings: Booking[];
//   totalPages: number;
//   totalElements: number;
// }

// // ================= API FUNCTIONS =================

// // 1. Fetch Bookings (Đã cập nhật xử lý Page)
// const fetchBookings = async ({ queryKey }: any): Promise<BookingQueryResponse> => {
//   const [_key, filter] = queryKey;

//   // Gọi API mới hỗ trợ phân trang
//   const res = await axiosClient.get("/hotel-bookings/check-in/search", {
//     params: {
//       keyword: filter.keyword,
//       page: filter.page,
//       size: filter.size,
//     },
//   });

//   // Backend trả về: ApiResponse < Page < HotelBooking > >
//   // Cấu trúc JSON: { data: { content: [...], totalPages: 5, ... } }
//   const pageData = res?.data?.data || res?.data;

//   return {
//     bookings: pageData?.content || [], // Lấy list từ .content
//     totalPages: pageData?.totalPages || 0,
//     totalElements: pageData?.totalElements || 0
//   };
// };

// // 2. Fetch Phòng trống
// const fetchAssignableRooms = async (bookingId: string): Promise<RoomData[]> => {
//   try {
//     const res = await axiosClient.get(`/hotel-bookings/${bookingId}/assignable-rooms`);
//     // Xử lý linh hoạt data trả về
//     return Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
//   } catch (error) {
//     console.error("Error fetching assignable rooms:", error);
//     return [];
//   }
// };

// // ================= MAIN COMPONENT =================
// const CheckAction: React.FC = () => {
//   const queryClient = useQueryClient();

//   // State Filter & Pagination
//   const [filter, setFilter] = useState({ keyword: "", page: 0, size: 10 }); // Size = 10 khớp với default Controller

//   // State UI
//   const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

//   // State cho Check In
//   const [assignableRooms, setAssignableRooms] = useState<RoomData[]>([]);
//   const [checkInRoomNumber, setCheckInRoomNumber] = useState<string>("");
//   const [isLoadingCheckInRooms, setIsLoadingCheckInRooms] = useState(false);

//   // === REACT QUERY ===
//   const { data, isFetching } = useQuery<BookingQueryResponse>({
//     queryKey: ["bookings", filter],
//     queryFn: fetchBookings,
//     placeholderData: keepPreviousData, // Giữ dữ liệu cũ khi chuyển trang
//     staleTime: 5000,
//   });

//   const bookings = data?.bookings || [];
//   const totalPages = data?.totalPages || 0;

//   // === HANDLERS ===

//   // Xử lý tìm kiếm (Reset về trang 0)
//   const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setFilter({ ...filter, keyword: e.target.value, page: 0 });
//   };

//   // Xử lý chuyển trang
//   const handlePageChange = (newPage: number) => {
//     if (newPage >= 0 && newPage < totalPages) {
//       setFilter({ ...filter, page: newPage });
//     }
//   };

//   // Chọn Booking
//   const handleSelectBooking = async (booking: Booking) => {
//     setSelectedBooking(booking);
//     setCheckInRoomNumber("");
//     setAssignableRooms([]);

//     if (booking.status === "CONFIRMED") {
//       setIsLoadingCheckInRooms(true);
//       try {
//         const rooms = await fetchAssignableRooms(booking.id);
//         setAssignableRooms(rooms);
//         if (rooms.length > 0) setCheckInRoomNumber(rooms[0].roomNumber);
//       } catch (error) {
//         toast.error("Không tải được danh sách phòng trống");
//       } finally {
//         setIsLoadingCheckInRooms(false);
//       }
//     }
//   };

//   // API Check In
//   const handleCheckIn = async () => {
//     if (!selectedBooking || !checkInRoomNumber) return;
//     try {
//       // Body khớp với DTO ManualCheckInRequest: { roomNumbers: ["301"] }
//       await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-in`, {
//         roomNumbers: [checkInRoomNumber],
//       });

//       toast.success(`Check-in thành công phòng ${checkInRoomNumber}`);
//       queryClient.invalidateQueries({ queryKey: ["bookings"] });
//       setSelectedBooking(null);
//     } catch (error: any) {
//       const msg = error?.response?.data?.message || error?.message || "Lỗi Check-in";
//       toast.error(msg);
//     }
//   };

//   // API Check Out
//   const handleCheckOut = async () => {
//     if (!selectedBooking) return;

//     const checkOutDate = new Date(selectedBooking.checkOutDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     let warningText = `Khách ${selectedBooking.customerName} - Phòng ${selectedBooking.assignedRoomNumbers}`;

//     if (checkOutDate > today) {
//       warningText = `⚠️ <b>Khách về sớm</b><br/>(Ngày gốc: ${selectedBooking.checkOutDate})<br/>Bạn chắc chắn muốn trả phòng?`;
//     }

//     const result = await Swal.fire({
//       title: "Xác nhận trả phòng?",
//       html: warningText,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#d33",
//       cancelButtonColor: "#3085d6",
//       confirmButtonText: "Đồng ý trả phòng",
//     });

//     if (result.isConfirmed) {
//       try {
//         await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-out`);
//         toast.success("Trả phòng thành công!");
//         queryClient.invalidateQueries({ queryKey: ["bookings"] });
//         setSelectedBooking(null);
//       } catch (error: any) {
//         toast.error(error?.response?.data?.message || "Lỗi Check-out");
//       }
//     }
//   };

//   // Component Badge hiển thị trạng thái
//   const StatusBadge: React.FC<{ status: BookingStatus }> = ({ status }) => {
//     const styles: Record<string, string> = {
//       CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
//       CHECKED_IN: "bg-blue-100 text-blue-700 border-blue-200",
//       CHECKED_OUT: "bg-amber-100 text-amber-700 border-amber-200",
//       CANCELLED: "bg-rose-100 text-rose-600 border-rose-200",
//     };
//     return (
//       <span className={`text-[10px] px-2 py-1 rounded-md border font-bold uppercase tracking-wider ${styles[status] || "bg-gray-100"}`}>
//         {status}
//       </span>
//     );
//   };

//   // ================= RENDER =================
//   return (
//     <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-1rem)] bg-gray-50 p-2 md:p-4 gap-4 overflow-hidden font-sans text-slate-800">
//       <ToastContainer position="top-center" autoClose={2000} aria-label="Check-in actions notifications" />

//       {/* --- LEFT PANEL: LIST --- */}
//       <div className="w-full lg:w-1/3 lg:min-w-[350px] bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">

//         {/* Header Search */}
//         <div className="p-4 border-b border-gray-100">
//           <div className="flex justify-between items-center mb-3">
//             <h2 className="text-lg font-bold flex items-center gap-2">
//               Danh sách
//               {isFetching && <span className="text-xs text-blue-500 animate-spin">⏳</span>}
//             </h2>
//             <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
//               {data?.totalElements || 0} đơn
//             </span>
//           </div>
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
//             <input
//               type="text"
//               placeholder="Tìm tên, SĐT, email..."
//               value={filter.keyword}
//               className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//               onChange={handleSearchChange}
//             />
//           </div>
//         </div>

//         {/* List Content */}
//         <div className="flex-1 overflow-y-auto p-2 space-y-2">
//           {bookings.length === 0 && !isFetching && (
//             <div className="text-center text-gray-400 mt-10 text-sm">Không tìm thấy dữ liệu.</div>
//           )}

//           {bookings.map((booking) => (
//             <div
//               key={booking.id}
//               onClick={() => handleSelectBooking(booking)}
//               className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedBooking?.id === booking.id
//                 ? "bg-blue-50 border-blue-400 ring-1 ring-blue-300"
//                 : "bg-white border-gray-100 hover:border-blue-200"
//                 }`}
//             >
//               <div className="flex justify-between items-start mb-2">
//                 <div className="flex items-center gap-3">
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shadow-sm
//                         ${selectedBooking?.id === booking.id ? 'bg-blue-600' : 'bg-slate-400'}`}>
//                     {booking.customerName ? booking.customerName.charAt(0).toUpperCase() : "?"}
//                   </div>
//                   <div>
//                     <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{booking.customerName || "Khách lẻ"}</h3>
//                     <p className="text-xs text-slate-500 flex items-center gap-1">
//                       <Phone className="w-3 h-3" /> {booking.customerPhone}
//                     </p>
//                   </div>
//                 </div>
//                 <StatusBadge status={booking.status} />
//               </div>
//               <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
//                 <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium truncate max-w-[150px]">
//                   {booking.roomTypeName}
//                 </span>
//                 {booking.assignedRoomNumbers && (
//                   <span className="flex items-center gap-1 font-bold text-slate-700">
//                     <MapPin className="w-3 h-3" /> P.{booking.assignedRoomNumbers}
//                   </span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Footer Pagination */}
//         <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-sm">
//           <button
//             onClick={() => handlePageChange(filter.page - 1)}
//             disabled={filter.page === 0}
//             className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
//           >
//             <ChevronLeft size={18} />
//           </button>

//           <span className="font-medium text-gray-600">
//             Trang {filter.page + 1} / {totalPages || 1}
//           </span>

//           <button
//             onClick={() => handlePageChange(filter.page + 1)}
//             disabled={filter.page >= totalPages - 1}
//             className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition"
//           >
//             <ChevronRight size={18} />
//           </button>
//         </div>
//       </div>

//       {/* --- RIGHT PANEL: ACTIONS --- */}
//       <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 overflow-y-auto">
//         {!selectedBooking ? (
//           <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
//             <DoorOpen size={64} strokeWidth={1} />
//             <p className="mt-4 font-medium">Chọn đơn đặt phòng để thao tác</p>
//           </div>
//         ) : (
//           <div className="max-w-2xl mx-auto animate-fade-in">
//             {/* Customer Info Header */}
//             <div className="mb-6 md:mb-8 text-center">
//               <h1 className="text-xl md:text-2xl font-bold text-slate-800">{selectedBooking.customerName}</h1>
//               <p className="text-slate-500 text-sm mt-1">{selectedBooking.customerEmail}</p>
//               <div className="mt-3 flex justify-center gap-3 text-sm text-slate-600">
//                 <span>📅 In: {selectedBooking.checkInDate}</span>
//                 <span>📅 Out: {selectedBooking.checkOutDate}</span>
//               </div>
//               <div className="mt-2"><StatusBadge status={selectedBooking.status} /></div>
//             </div>

//             {/* === CASE 1: CHECK IN === */}
//             {selectedBooking.status === "CONFIRMED" && (
//               <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-sm">
//                 <h3 className="text-emerald-800 font-bold text-lg mb-4 flex items-center gap-2">
//                   <LogIn className="w-5 h-5" /> Xác nhận Check In
//                 </h3>

//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-emerald-900 mb-2">
//                     Chọn phòng (Sẵn sàng)
//                   </label>
//                   {isLoadingCheckInRooms ? (
//                     <div className="p-3 text-sm text-emerald-600 animate-pulse bg-emerald-100 rounded-lg">Đang tải danh sách phòng...</div>
//                   ) : (
//                     <select
//                       className="w-full p-3 border border-emerald-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 font-medium cursor-pointer"
//                       value={checkInRoomNumber}
//                       onChange={(e) => setCheckInRoomNumber(e.target.value)}
//                     >
//                       {assignableRooms.length === 0 ? (
//                         <option value="">⚠️ Không có phòng trống phù hợp</option>
//                       ) : (
//                         assignableRooms.map(room => (
//                           <option key={room.id} value={room.roomNumber}>
//                             Phòng {room.roomNumber} ({room.status})
//                           </option>
//                         ))
//                       )}
//                     </select>
//                   )}
//                 </div>

//                 <button
//                   onClick={handleCheckIn}
//                   disabled={!checkInRoomNumber || assignableRooms.length === 0}
//                   className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//                 >
//                   XÁC NHẬN CHECK IN
//                 </button>
//               </div>
//             )}

//             {/* === CASE 2: CHECK OUT === */}
//             {selectedBooking.status === "CHECKED_IN" && (
//               <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-sm">
//                 <h3 className="text-blue-800 font-bold text-lg mb-4 flex items-center gap-2">
//                   <LogOut className="w-5 h-5" /> Xác nhận Trả phòng
//                 </h3>
//                 <div className="bg-white p-4 rounded-lg border border-blue-100 mb-5 flex justify-between items-center shadow-sm">
//                   <span className="text-slate-500 text-sm font-medium">Phòng đang ở</span>
//                   <span className="text-3xl font-bold text-blue-600">{selectedBooking.assignedRoomNumbers}</span>
//                 </div>
//                 <button
//                   onClick={handleCheckOut}
//                   className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
//                 >
//                   CHECK OUT & THANH TOÁN
//                 </button>
//               </div>
//             )}

//             {/* === CASE 3: CLEAN ROOM === */}
//             {selectedBooking.status === "CHECKED_OUT" && (
//               <CleanRoomAction
//                 booking={selectedBooking}
//                 onSuccess={() => {
//                   queryClient.invalidateQueries({ queryKey: ["bookings"] });
//                   setSelectedBooking(null);
//                 }}
//               />
//             )}

//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CheckAction;

import React, { useState, useEffect } from 'react';
import axiosClient from '@/axiosclient'; // Import client vừa tạo
import { MapPin, Phone, Globe, Star, Calendar, ArrowRight, Heart, Loader2, AlertCircle } from 'lucide-react';

// --- Interfaces ---
interface Hotel {
  id: string;
  name: string;
  address: string;
  phone: string;
  currency: string;
  lowestPrice: number;
  states: string;
  logo: string;
  galleryImageIds: string[];
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    content: Hotel[];
    totalElements: number;
  };
}

const HotelBookingPage: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkIn = "2026-07-02";
  const checkOut = "2026-07-03";

  // --- Hàm gọi API bằng Axios ---
  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError(null);

      // Sử dụng axiosClient đã cấu hình
      const response = await axiosClient.get<any, ApiResponse>('/hotels', {
        params: {
          checkIn: checkIn,
          checkOut: checkOut,
        },
      });

      if (response.success) {
        setHotels(response.data.content);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      // Axios trả về lỗi trong err.response hoặc err.message
      setError(err.response?.data?.message || "Không thể kết nối đến máy chủ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'VND',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfd] font-sans">
      {/* Header */}
      <nav className="bg-white/70 backdrop-blur-xl border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-indigo-200 shadow-xl">
              <Globe className="text-white w-7 h-7" />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tighter">MOMANGSHOW X BLUEJAY</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
             <div className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 border-r border-slate-200">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>{checkIn} → {checkOut}</span>
             </div>
             <button onClick={fetchHotels} className="px-6 py-2 bg-white rounded-xl text-sm font-bold text-indigo-600 shadow-sm border border-slate-100 hover:bg-indigo-50 transition-all">
                Cập nhật dữ liệu
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
           <span className="text-indigo-600 font-bold tracking-widest text-xs uppercase bg-indigo-50 px-3 py-1 rounded-full">Khám phá Việt Nam</span>
           <h1 className="text-5xl font-black text-slate-900 mt-4 tracking-tight">Check in & Check out<br/></h1>
        </div>

        {/* Trạng thái Loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-[2.5rem] border h-[500px]">
                <div className="h-64 bg-slate-100 rounded-t-[2.5rem]" />
                <div className="p-8 space-y-4">
                    <div className="h-6 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-16 bg-slate-100 rounded-3xl mt-10" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-10 rounded-[2.5rem] border border-red-100 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-800">Lỗi: {error}</h3>
            <button onClick={fetchHotels} className="mt-6 px-8 py-3 bg-red-600 text-white rounded-2xl font-bold shadow-lg hover:bg-red-700 transition-all">Thử lại ngay</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {hotels.map((hotel) => (
              <div 
                key={hotel.id} 
                className="group bg-white rounded-[2.5rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_30px_60px_rgba(79,70,229,0.15)] hover:-translate-y-3 transition-all duration-500 border border-slate-50 flex flex-col"
              >
                {/* Image Section */}
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={hotel.galleryImageIds.length > 0 ? hotel.galleryImageIds[0] : hotel.logo} 
                    alt={hotel.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                  />
                  <div className="absolute top-6 right-6">
                    <button className="w-12 h-12 bg-white/60 backdrop-blur-xl rounded-2xl text-slate-800 hover:text-red-500 hover:bg-white flex items-center justify-center shadow-lg transition-all">
                      <Heart className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute bottom-6 left-6">
                    <span className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-xl">
                      {hotel.states}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <h2 className="text-2xl font-black text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors mb-3">
                    {hotel.name}
                  </h2>
                  <div className="flex items-start gap-2 text-slate-400 text-sm font-medium mb-6 h-10">
                    <MapPin className="w-4 h-4 text-indigo-400 mt-1 flex-shrink-0" />
                    <span className="line-clamp-2 leading-relaxed">{hotel.address}</span>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Giá chỉ từ</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">
                            {formatCurrency(hotel.lowestPrice, hotel.currency)}
                        </p>
                    </div>
                    <button className="h-14 w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 group-hover:shadow-indigo-200">
                        <ArrowRight className="w-7 h-7" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
export default HotelBookingPage;