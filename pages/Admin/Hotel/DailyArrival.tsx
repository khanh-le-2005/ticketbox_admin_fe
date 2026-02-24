import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  FaCalendarAlt, FaSearch, FaPhone, FaBed, FaDoorOpen,
  FaCheckCircle, FaSpinner, FaSignOutAlt, FaTimes, FaFilter
} from "react-icons/fa";
import axiosClient from "@/axiosclient"; // Đảm bảo axiosClient đã cấu hình baseURL và header Authorization
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// --- TYPE DEFINITIONS (Cập nhật theo JSON response) ---
interface BookingData {
  id: string;
  hotelId: string;
  hotelName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  roomTypeName: string;
  roomTypeCode: string;
  quantity: number;
  status: string; // CANCELLED, CONFIRMED, CHECKED_IN, CHECKED_OUT...
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  createdAt: string;
  assignedRoomNumbers: string | null;
}

// Interface cho phòng trống
interface AssignableRoom {
  id: string;
  roomNumber: string;
  status: string;
}

const HotelBookingFilter: React.FC = () => {
  const { id: hotelId } = useParams<{ id: string }>();

  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [rawData, setRawData] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);

  // --- STATE BỘ LỌC NGÀY ---
  const [dateOption, setDateOption] = useState("THIS_MONTH");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // --- STATE TÌM KIẾM & PHÂN TRANG ---
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // --- STATE MODAL ---
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [assignableRooms, setAssignableRooms] = useState<AssignableRoom[]>([]);
  const [selectedRoomNum, setSelectedRoomNum] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  // --- 1. TỰ ĐỘNG TÍNH NGÀY ---
  useEffect(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    const resetTime = (d: Date) => d.setHours(0, 0, 0, 0);
    resetTime(now);

    switch (dateOption) {
      case "TODAY":
        break;
      case "YESTERDAY":
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
        break;
      case "THIS_WEEK":
        const day = now.getDay() || 7;
        start.setDate(now.getDate() - day + 1);
        end.setDate(now.getDate() - day + 7);
        break;
      case "THIS_MONTH":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "LAST_MONTH":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "CUSTOM":
        return;
      default:
        break;
    }

    setFromDate(start.toISOString().split('T')[0]);
    setToDate(end.toISOString().split('T')[0]);
  }, [dateOption]);

  // --- 2. FETCH DATA TỪ API (GỌI TRỰC TIẾP) ---
  const fetchBookings = useCallback(async () => {
    if (!fromDate || !toDate) return;

    setLoading(true);
    try {
      // Endpoint: {{base_url}}/api/hotel-bookings/filter?checkInFrom=...&checkInTo=...
      console.log(`📡 Đang gọi API Filter: ${fromDate} đến ${toDate}`);

      // const response = await axiosClient.get('/api/hotel-bookings/filter', {
      //   params: {
      //     checkInFrom: fromDate,
      //     checkInTo: toDate
      //     // Lưu ý: Nếu API hỗ trợ lọc theo hotelId tại server thì thêm: hotelId: hotelId
      //   }
      // });

      const response = await axiosClient.get(
        "/hotel-bookings/filter",
        {
          params: {
            checkInFrom: fromDate,
            checkInTo: toDate,
          },
        }
      );


      const resData = response.data;

      console.log("📦 Data nhận được:", resData);

      if (resData != null) {
        console.log("📦 Data nhận được:", resData);

        // // Lọc theo Hotel ID (Client side filter để đảm bảo chỉ hiện khách sạn hiện tại)
        // const filteredByHotel = resData.filter(
        //   (item: BookingData) => item.hotelId === hotelId
        // );
        setRawData(resData);
      } else {
        setRawData([]);
        toast.info(resData?.message || "Không tìm thấy dữ liệu");
      }
    } catch (error) {
      console.error("❌ Lỗi API:", error);
      toast.error("Lỗi tải danh sách đặt phòng.");
    } finally {
      setLoading(false);
    }
  }, [hotelId, fromDate, toDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // --- 3. FILTER & PAGINATION (CLIENT-SIDE) ---
  const processedData = useMemo(() => {
    let data = [...rawData];

    if (keyword) {
      const lowerKey = keyword.toLowerCase();
      data = data.filter(item =>
        item.customerName?.toLowerCase().includes(lowerKey) ||
        item.customerPhone?.includes(keyword) ||
        item.id.toLowerCase().includes(lowerKey) ||
        (item.assignedRoomNumbers && item.assignedRoomNumbers.toLowerCase().includes(lowerKey))
      );
    }

    // Sắp xếp: Mới nhất lên đầu
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return data;
  }, [rawData, keyword]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  const currentTableData = processedData.slice(page * pageSize, (page + 1) * pageSize);

  // --- 4. CÁC HÀM XỬ LÝ (CHECK-IN/OUT TRỰC TIẾP) ---

  // Lấy danh sách phòng trống
  const fetchAssignableRooms = async (bookingId: string) => {
    try {
      const res = await axiosClient.get(`/hotel-bookings/${bookingId}/assignable-rooms`);
      const rooms = Array.isArray(res.data) ? res.data : Array.isArray(res.data?.data) ? res.data.data : [];
      setAssignableRooms(rooms);
      if (rooms.length > 0) setSelectedRoomNum(rooms[0].roomNumber);
      else setSelectedRoomNum("");
    } catch (error: any) {
      toast.error("Không tải được phòng trống");
    }
  };

  const handleOpenCheckIn = async (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowCheckInModal(true);
    setAssignableRooms([]);

    if (booking.assignedRoomNumbers) {
      setSelectedRoomNum(booking.assignedRoomNumbers.split(',')[0].trim());
    }

    await fetchAssignableRooms(booking.id);
  };

  // Submit Check-in (Gọi API trực tiếp)
  const submitCheckIn = async () => {
    if (!selectedBooking || !selectedRoomNum) {
      toast.warning("Vui lòng chọn số phòng!");
      return;
    }
    setProcessingAction(true);
    try {
      // Endpoint Check-in
      await axiosClient.post(`/api/hotel-bookings/${selectedBooking.id}/check-in`, {
        roomNumbers: [selectedRoomNum],
      });

      toast.success("Check-in thành công!");
      setShowCheckInModal(false);
      fetchBookings();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi Check-in");
    } finally {
      setProcessingAction(false);
    }
  };

  // Submit Check-out (Gọi API trực tiếp)
  const handleCheckOut = async (bookingId: string) => {
    const result = await Swal.fire({
      title: "Xác nhận trả phòng",
      text: "Bạn có chắc chắn muốn check-out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy"
    });

    if (!result.isConfirmed) return;

    setProcessingAction(true);
    try {
      // Endpoint Check-out
      await axiosClient.post(`/api/hotel-bookings/${bookingId}/check-out`);

      toast.success("Đã trả phòng!");
      fetchBookings();
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Lỗi trả phòng");
    } finally {
      setProcessingAction(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-700 border-green-200';
      case 'CHECKED_IN': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'CHECKED_OUT': return 'bg-gray-200 text-gray-600 border-gray-300';
      case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* --- HEADER & FILTER SECTION --- */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <FaDoorOpen className="text-blue-600" />
                Danh Sách Khách Đến (Check-in)
              </h1>
              <p className="text-sm text-slate-500 mt-1">Quản lý đặt phòng theo ngày Check-in</p>
            </div>

            <div className="relative group w-full lg:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT, Mã đơn..."
                value={keyword}
                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
              {keyword && (
                <button onClick={() => setKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500">
                  <FaTimes />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div className="relative">
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Khoảng thời gian</label>
              <div className="relative">
                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  value={dateOption}
                  onChange={(e) => setDateOption(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white cursor-pointer font-medium text-slate-700"
                >
                  <option value="TODAY">Hôm nay</option>
                  <option value="YESTERDAY">Hôm qua</option>
                  <option value="THIS_WEEK">Tuần này</option>
                  <option value="THIS_MONTH">Tháng này</option>
                  <option value="CUSTOM">Tùy chỉnh...</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Check-in Từ</label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                <FaCalendarAlt className="text-slate-400" />
                <input
                  type="date"
                  value={fromDate}
                  disabled={dateOption !== 'CUSTOM'}
                  onChange={(e) => { setFromDate(e.target.value); setDateOption('CUSTOM'); }}
                  className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đến ngày</label>
              <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white">
                <span className="text-slate-400"><FaCalendarAlt /></span>
                <input
                  type="date"
                  value={toDate}
                  disabled={dateOption !== 'CUSTOM'}
                  onChange={(e) => { setToDate(e.target.value); setDateOption('CUSTOM'); }}
                  className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchBookings}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm active:scale-95"
              >
                Lọc dữ liệu
              </button>
            </div>
          </div>
        </div>

        {/* --- TABLE CONTENT --- */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
          {loading ? (
            <div className="p-20 text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
              <p className="text-slate-500">Đang tải dữ liệu từ API...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Thông tin phòng</th>
                    <th className="p-4">Lịch check-in/out</th>
                    <th className="p-4 text-center">Trạng thái</th>
                    <th className="p-4 text-right">Tổng tiền</th>
                    <th className="p-4 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentTableData.length > 0 ? (
                    currentTableData.map((item) => (
                      <tr key={item.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-800 text-base">{item.customerName}</div>
                          <div className="text-slate-500 flex items-center gap-1 mt-1">
                            <FaPhone size={10} /> {item.customerPhone}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {item.customerEmail}
                          </div>
                        </td>

                        <td className="p-4">
                          <div className="font-medium text-slate-700">{item.roomTypeName}</div>
                          {item.assignedRoomNumbers ? (
                            <span className="inline-flex items-center gap-1 mt-1 bg-orange-50 text-orange-600 border border-orange-100 px-2 py-0.5 rounded text-xs font-bold">
                              <FaBed /> {item.assignedRoomNumbers}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic mt-1 block">Chưa gán số phòng</span>
                          )}
                        </td>

                        <td className="p-4">
                          <div className="flex items-center justify-between w-36 mb-1">
                            <span className="text-slate-400 text-xs">In:</span>
                            <span className="font-medium text-green-600">{item.checkInDate}</span>
                          </div>
                          <div className="flex items-center justify-between w-36">
                            <span className="text-slate-400 text-xs">Out:</span>
                            <span className="font-medium text-red-500">{item.checkOutDate}</span>
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <span className={`px-2 py-1 rounded text-[11px] font-bold border ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>

                        <td className="p-4 text-right font-bold text-slate-700">
                          {formatCurrency(item.totalAmount)}
                        </td>

                        <td className="p-4 text-center">
                          {item.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleOpenCheckIn(item)}
                              className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg shadow transition"
                              title="Check-in"
                            >
                              <FaCheckCircle />
                            </button>
                          )}
                          {item.status === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCheckOut(item.id)}
                              disabled={processingAction}
                              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow transition disabled:opacity-50"
                              title="Check-out"
                            >
                              <FaSignOutAlt />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-500">
                        Không có dữ liệu nào trong khoảng thời gian này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* --- PAGINATION --- */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="text-xs text-slate-500">
                Trang {page + 1} / {totalPages}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 text-sm"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 text-sm"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* === MODAL CHECK-IN === */}
      {showCheckInModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2"><FaCheckCircle /> Xác nhận Check-in</h3>
              <button onClick={() => setShowCheckInModal(false)} className="hover:bg-green-700 p-1 rounded-full"><FaTimes /></button>
            </div>
            <div className="p-6">
              <div className="mb-4 bg-green-50 p-3 rounded-lg border border-green-100">
                <p className="text-lg font-bold text-slate-800">{selectedBooking.customerName}</p>
                <p className="text-sm text-slate-600">{selectedBooking.roomTypeName}</p>
              </div>

              <label className="block text-sm font-bold text-slate-700 mb-2">Gán phòng:</label>
              <select
                className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-green-500 outline-none font-medium mb-6"
                value={selectedRoomNum}
                onChange={(e) => setSelectedRoomNum(e.target.value)}
              >
                <option value="" disabled>-- Chọn phòng trống --</option>
                {selectedBooking.assignedRoomNumbers &&
                  !assignableRooms.find(r => r.roomNumber === selectedBooking.assignedRoomNumbers) && (
                    <option value={selectedBooking.assignedRoomNumbers}>
                      {selectedBooking.assignedRoomNumbers} (Đang gán)
                    </option>
                  )}
                {assignableRooms.map((r) => (
                  <option key={r.id} value={r.roomNumber}>
                    Phòng {r.roomNumber} ({r.status})
                  </option>
                ))}
              </select>

              <div className="flex gap-3">
                <button onClick={() => setShowCheckInModal(false)} className="flex-1 py-3 border border-slate-300 rounded-lg font-bold hover:bg-slate-100">Đóng</button>
                <button
                  onClick={submitCheckIn}
                  disabled={processingAction}
                  className="flex-1 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 shadow-lg disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {processingAction && <FaSpinner className="animate-spin" />} Check-in Ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HotelBookingFilter;