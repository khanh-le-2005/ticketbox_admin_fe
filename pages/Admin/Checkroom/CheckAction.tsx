import React, { useState, useEffect } from "react";
// 👇 1. Thay axios bằng axiosClient
import axiosClient from "@/axiosclient"; 
// (Lưu ý: Bạn kiểm tra lại đường dẫn import axiosClient cho đúng với cấu trúc folder của bạn)

// --- TYPE DEFINITIONS ---
interface Booking {
  id: string;
  hotelId: string;
  hotelName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  roomTypeName: string;
  checkInDate: string;
  checkOutDate: string;
  status: "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | string;
  assignedRoomNumbers: string | null;
  assignedRoomIds?: string | null;
  totalAmount: number;
}

interface AssignableRoom {
  id: string;
  roomNumber: string;
  status: string;
}

const HotelBookingManager: React.FC = () => {
  // --- STATE ---
  const [keyword, setKeyword] = useState("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [assignableRooms, setAssignableRooms] = useState<AssignableRoom[]>([]);
  const [selectedRoomNum, setSelectedRoomNum] = useState("");
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [manualRoomId, setManualRoomId] = useState("");

  const [notification, setNotification] = useState<{
    type: "success" | "error" | "";
    msg: string;
    visible: boolean;
  }>({ type: "", msg: "", visible: false });

  // --- HÀM HIỂN THỊ THÔNG BÁO ---
  const showToast = (type: "success" | "error", msg: string) => {
    setNotification({ type, msg, visible: true });
    setTimeout(() => {
        setNotification((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // --- HÀM GỌI API (ĐÃ SỬA DÙNG axiosClient) ---
  const fetchData = async (searchKeyword: string) => {
    setIsSearching(true);
    if (searchKeyword.trim()) setBookings([]);

    try {
      console.log(`📡 Fetching... "${searchKeyword}"`);
      
      // 👇 2. Gọi qua axiosClient (Tự động gắn Token)
      // URL gốc: /api/v1/hotel-bookings/history/search (Tuỳ vào baseURL của axiosClient)
      // Nếu baseURL là '.../api/v1' thì chỉ cần gọi '/hotel-bookings/...'
      const res: any = await axiosClient.get(
        `/hotel-bookings/history/search`, 
        { params: { keyword: searchKeyword, page: 0, size: 30 } }
      );

      // 👇 3. Xử lý response (axiosClient thường đã bóc 1 lớp .data)
      // Kiểm tra xem res có phải là object chứa success không, hay là mảng luôn
      const responseData = res.data || res; 

      if (responseData.success && responseData.data?.content) {
        setBookings(responseData.data.content);
      } else if (Array.isArray(responseData)) {
          setBookings(responseData);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(keyword), 500);
    return () => clearTimeout(timer);
  }, [keyword]);

  const clearSearch = () => setKeyword("");

  const handleSelectBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setAssignableRooms([]);
    setSelectedRoomNum("");
    setManualRoomId("");
    if (booking.status === "CONFIRMED") {
      fetchAssignableRooms(booking.id);
    }
  };

  const fetchAssignableRooms = async (bookingId: string) => {
    setIsLoadingRooms(true);
    try {
      // 👇 Gọi qua axiosClient
      const res: any = await axiosClient.get(`/hotel-bookings/${bookingId}/assignable-rooms`);
      const rooms = res.data || res; // Bóc tách dữ liệu
      
      if (Array.isArray(rooms) && rooms.length > 0) {
        setAssignableRooms(rooms);
        setSelectedRoomNum(rooms[0].roomNumber);
      } else {
        setAssignableRooms([]);
        showToast("error", "⚠️ Hết phòng trống cho loại này!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingRooms(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedBooking || !selectedRoomNum) return;
    try {
      // 👇 Gọi qua axiosClient (POST)
      await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-in`, { 
          roomNumbers: [selectedRoomNum] 
      });
      
      showToast("success", `✅ Check-in thành công phòng ${selectedRoomNum}!`);
      
      fetchData(keyword);
      setSelectedBooking({ ...selectedBooking, status: "CHECKED_IN", assignedRoomNumbers: selectedRoomNum });
    } catch (error: any) {
      // Lỗi từ axiosClient trả về thường nằm trong error.response hoặc error.message
      const msg = error.response?.data?.message || error.message || "Lỗi không xác định";
      showToast("error", "❌ Lỗi Check-in: " + msg);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedBooking) return;
    if (!window.confirm("Xác nhận trả phòng?")) return;
    try {
      // 👇 Gọi qua axiosClient (POST)
      await axiosClient.post(`/hotel-bookings/${selectedBooking.id}/check-out`);
      
      showToast("success", "✅ Trả phòng thành công!");
      
      fetchData(keyword);
      setSelectedBooking({ ...selectedBooking, status: "CHECKED_OUT" });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      showToast("error", "❌ Lỗi Trả phòng: " + msg);
    }
  };

  const handleClean = async () => {
    if (!selectedBooking) return;
    const roomId = selectedBooking.assignedRoomIds || manualRoomId.trim();
    if (!roomId) return showToast("error", "Vui lòng nhập ID phòng!");

    try {
      // 👇 Gọi qua axiosClient (PUT)
      // Lưu ý đường dẫn /hotels/...
      await axiosClient.put(`/hotels/${selectedBooking.hotelId}/rooms/${roomId}/clean`);
      
      showToast("success", "✨ Dọn phòng sạch sẽ (Status: AVAILABLE)");
      
      setManualRoomId("");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      showToast("error", "Lỗi Clean: " + msg);
    }
  };

  const formatDate = (d: string) => (d ? d.split("T")[0] : "");
  const getStatusColor = (s: string) => {
    if (s === "CONFIRMED") return "bg-green-100 text-green-800 border-green-200";
    if (s === "CHECKED_IN") return "bg-blue-100 text-blue-800 border-blue-200";
    if (s === "CHECKED_OUT") return "bg-gray-200 text-gray-600 border-gray-300";
    return "bg-red-50 text-red-600 border-red-100";
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans p-4 gap-4 relative">
      
      {/* TOAST NOTIFICATION */}
      <div 
        className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-in-out transform ${
            notification.visible ? "translate-y-0 opacity-100" : "-translate-y-10 opacity-0 pointer-events-none"
        }`}
      >
         <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl border-l-8 min-w-[320px] max-w-[450px] ${
            notification.type === 'success' 
            ? 'bg-white border-green-500 text-green-800' 
            : 'bg-white border-red-500 text-red-800'
         }`}>
            <div className={`text-2xl ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                {notification.type === 'success' ? '✔' : '✖'}
            </div>
            <div>
                <h4 className="font-bold text-sm uppercase mb-1">
                    {notification.type === 'success' ? 'Thành công' : 'Có lỗi xảy ra'}
                </h4>
                <p className="text-sm font-medium text-gray-600">{notification.msg}</p>
            </div>
            <button 
                onClick={() => setNotification(prev => ({...prev, visible: false}))}
                className="ml-auto text-gray-400 hover:text-gray-600"
            >
                ✕
            </button>
         </div>
      </div>

      {/* CỘT TRÁI: DANH SÁCH */}
      <div className="w-[35%] bg-white rounded-xl shadow-md flex flex-col overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-bold text-gray-700 mb-2 flex items-center justify-between">
            <span>{keyword ? "🔍 Kết quả" : "📋 Lịch sử"}</span>
            {isSearching && <span className="text-xs text-blue-500 animate-spin">⏳</span>}
          </h2>
          <div className="relative group">
            <input
              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm transition"
              placeholder="Tìm tên, SĐT, Email..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            {keyword && (
              <button onClick={clearSearch} className="absolute right-2 top-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full p-1">✕</button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
          {isSearching && bookings.length === 0 && (
             <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center text-gray-400">
                <div className="animate-spin text-2xl mb-2">↻</div><span className="text-sm">Đang tìm...</span>
             </div>
          )}
          {bookings.length === 0 && !isSearching ? (
            <div className="text-center text-gray-400 mt-10 text-sm">{keyword ? "Không tìm thấy kết quả." : "Chưa có dữ liệu."}</div>
          ) : (
            bookings.map((booking) => (
                <div key={booking.id} onClick={() => handleSelectBooking(booking)} className={`p-3 rounded-lg border cursor-pointer transition hover:shadow-md ${selectedBooking?.id === booking.id ? "bg-blue-50 border-blue-400 ring-1 ring-blue-400" : "bg-white border-gray-200 hover:border-blue-300"}`}>
                <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-800 truncate text-sm">{booking.customerName || "Khách lẻ"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(booking.status)}`}>{booking.status}</span>
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-1">
                    <div className="flex justify-between">
                        <span>📱 {booking.customerPhone}</span>
                        <span className="font-mono text-gray-400 text-[10px]">#{booking.id.slice(-4)}</span>
                    </div>
                </div>
                </div>
            ))
          )}
        </div>
      </div>

      {/* CỘT PHẢI: CHI TIẾT */}
      <div className="w-[65%] flex flex-col gap-4">
        <div className="flex-1 bg-white rounded-xl shadow-md p-6 overflow-y-auto relative">
          {!selectedBooking ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-6xl mb-4 opacity-20">🏨</span>
              <p>Vui lòng chọn khách hàng</p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{selectedBooking.customerName}</h1>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <p>📱 <strong>SĐT:</strong> {selectedBooking.customerPhone}</p>
                  <p>📧 <strong>Email:</strong> {selectedBooking.customerEmail}</p>
                  <p>🏨 <strong>Loại phòng:</strong> {selectedBooking.roomTypeName}</p>
                  <p>🗓️ <strong>Check-in:</strong> {formatDate(selectedBooking.checkInDate)}</p>
                  <p>🏷️ <strong>Trạng thái:</strong> <span className={`px-2 py-0.5 rounded ${getStatusColor(selectedBooking.status)}`}>{selectedBooking.status}</span></p>
                  
                  {selectedBooking.assignedRoomNumbers && (
                    <>
                        <p className="text-purple-700 font-bold">🔑 Phòng: {selectedBooking.assignedRoomNumbers}</p>
                    </>
                  )}
                </div>
              </div>

              {/* ACTION SECTIONS */}
              {selectedBooking.status === "CONFIRMED" && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h3 className="text-green-800 font-bold mb-4">📥 Check In</h3>
                  <div className="mb-4">
                    <label className="block text-sm mb-1 text-gray-600">Chọn phòng trống:</label>
                    <select className="w-full p-2 border border-green-300 rounded bg-white" value={selectedRoomNum} onChange={(e) => setSelectedRoomNum(e.target.value)}>
                      {!assignableRooms.length && <option value="">Không có phòng!</option>}
                      {assignableRooms.map((r) => (<option key={r.id} value={r.roomNumber}>{r.roomNumber} ({r.status})</option>))}
                    </select>
                  </div>
                  <button onClick={handleCheckIn} disabled={!selectedRoomNum || !assignableRooms.length} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded shadow disabled:bg-gray-400">XÁC NHẬN</button>
                </div>
              )}

              {selectedBooking.status === "CHECKED_IN" && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                  <h3 className="text-blue-800 font-bold mb-4">📤 Check Out</h3>
                  <p className="mb-4 text-gray-600">Phòng <strong className="text-blue-700 text-xl">{selectedBooking.assignedRoomNumbers}</strong></p>
                  <button onClick={handleCheckOut} className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded shadow">TRẢ PHÒNG</button>
                </div>
              )}

              {selectedBooking.status === "CHECKED_OUT" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                  <h3 className="text-yellow-800 font-bold mb-2">🧹 Dọn Phòng</h3>
                  <p className="text-sm text-gray-600 mb-4">Cần làm sạch phòng <strong>{selectedBooking.assignedRoomNumbers}</strong>.</p>
                  {!selectedBooking.assignedRoomIds && (
                    <input className="w-full p-2 border border-yellow-300 rounded mb-2 text-sm" placeholder="Nhập ID phòng nếu hệ thống thiếu..." value={manualRoomId} onChange={(e) => setManualRoomId(e.target.value)} />
                  )}
                  <button onClick={handleClean} className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded shadow">XÁC NHẬN DỌN XONG</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelBookingManager;