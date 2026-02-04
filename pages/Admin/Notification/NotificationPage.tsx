import React, { useEffect, useState } from 'react';
import axiosClient from '@/axiosclient';
import {
    Bell, Search, Filter, Trash2, CheckCircle,
    Info, XCircle, Loader2, Calendar, User, CreditCard, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationPage = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');

    // State Modal
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailLoading, setIsDetailLoading] = useState(false);

    const navigate = useNavigate();

    // 1. Fetch thông báo
    const fetchFullNotifications = async () => {
        setLoading(true);

        try {
            const res = await axiosClient.get('/notifications?page=0&size=50');
            setNotifications(res.content || res.data || []);
        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFullNotifications(); }, []);

    // 2. Hàm xử lý: Đánh dấu đã đọc
    const markAsRead = async (id) => {
        try {
            await axiosClient.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (err) { console.error(err); }
    };

    // 3. Hàm xử lý: Xem chi tiết (Quan trọng nhất)
    const handleShowDetail = async (notif) => {
        // 1. Đánh dấu đã đọc
        if (!notif.read) markAsRead(notif.id);

        if (!notif.targetUrl) return;

        console.log("Target URL:", notif.targetUrl); // Debug xem url là gì

        // 2. SỬA LẠI ĐIỀU KIỆN CHECK URL
        // Chấp nhận cả '/hotel-bookings/' VÀ '/bookings/'
        const isBookingUrl = notif.targetUrl.includes('/hotel-bookings/') || notif.targetUrl.includes('/bookings/');

        if (isBookingUrl) {
            // Xử lý chuỗi để lấy ID
            const cleanUrl = notif.targetUrl.split('?')[0].replace(/\/+$/, "");
            const bookingId = cleanUrl.split('/').pop();

            console.log("Booking ID tách được:", bookingId);

            if (bookingId) {
                setIsDetailLoading(true);
                try {
                    // Lưu ý: Đường dẫn API giữ nguyên là /hotel-bookings/ hay đổi thành /bookings/ ?
                    // Thường API vẫn giữ nguyên, chỉ đường dẫn thông báo thay đổi.
                    // Nếu API báo 404 thì bạn đổi dòng dưới thành: axiosClient.get(`/bookings/${bookingId}`)
                    const res = await axiosClient.get(`/hotel-bookings/${bookingId}`);

                    const bookingData = res.data || res;

                    if (bookingData) {
                        setSelectedBooking(bookingData);
                        setIsModalOpen(true);
                    }
                } catch (error) {
                    console.error("Lỗi lấy chi tiết:", error);
                    alert("Không thể tải đơn hàng (ID: " + bookingId + ")");
                } finally {
                    setIsDetailLoading(false);
                }
                // QUAN TRỌNG: Return để không chuyển trang
                return;
            }
        }

        // 3. Các trường hợp khác -> Chuyển trang
        navigate(notif.targetUrl);
    };
    // --- Helper Formatter ---
    const formatCurrency = (val) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-'); // Dữ liệu của bạn là YYYY-MM-DD
        return `${day}/${month}/${year}`;
    };

    // Helper hiển thị trạng thái (Dựa trên JSON status: "CANCELLED")
    const getStatusBadge = (status) => {
        switch (status) {
            case 'CANCELLED': return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-200">Đã hủy</span>;
            case 'CHECKED_OUT': return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">Đã trả phòng</span>;
            case 'CONFIRMED': return <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Đã xác nhận</span>;
            case 'PENDING': return <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">Chờ thanh toán</span>;
            default: return <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto min-h-screen bg-gray-50/50">
            {/* Header & Filter giữ nguyên */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                    <Bell className="text-blue-600" /> Trung tâm thông báo
                </h1>
                <button className="px-4 py-2 bg-white text-blue-600 rounded-lg font-medium border border-blue-100 shadow-sm text-sm hover:bg-blue-50">
                    <CheckCircle size={16} className="inline mr-1" /> Đánh dấu tất cả đã đọc
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                </div>
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none bg-white"
                >
                    <option value="ALL">Tất cả</option>
                    <option value="UNREAD">Chưa đọc</option>
                </select>
            </div>

            {/* List thông báo */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                {loading ? (
                    <div className="p-20 text-center text-gray-500"><Loader2 className="animate-spin inline mr-2" />Đang tải...</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                            <div key={notif.id} className={`p-5 flex gap-4 hover:bg-gray-50 transition-all ${!notif.read ? 'bg-blue-50/40' : ''}`}>
                                <div className={`p-3 rounded-full h-fit ${!notif.read ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between">
                                        <h3 className={`text-base ${!notif.read ? 'font-bold text-gray-900' : 'font-medium text-gray-600'}`}>{notif.title}</h3>
                                        <span className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString('vi-VN')}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1 mb-3">{notif.content}</p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleShowDetail(notif)}
                                            className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            {isDetailLoading ? <Loader2 size={14} className="animate-spin" /> : <Info size={16} />} Xem chi tiết
                                        </button>
                                        <button className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={16} /> Xóa</button>
                                    </div>
                                </div>
                                {!notif.read && <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* --- MODAL CHI TIẾT ĐƠN HÀNG (Mapping đúng key JSON) --- */}
            {isModalOpen && selectedBooking && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

                        {/* 1. Header Modal */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl z-10">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                                <Info className="text-blue-600" size={20} /> Chi tiết đơn đặt phòng
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={24} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>

                        {/* 2. Body Modal - Hiển thị đúng các trường yêu cầu */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">

                            {/* Tên khách sạn */}
                            <div className="mb-5 text-center">
                                <h2 className="text-xl font-bold text-blue-900 uppercase leading-snug">
                                    {selectedBooking.hotelName}
                                </h2>
                                <div className="mt-2 flex justify-center items-center gap-2">
                                    {getStatusBadge(selectedBooking.status)}
                                    <span className="text-xs text-gray-400 px-2 py-1 bg-gray-50 rounded">
                                        #{selectedBooking.id?.slice(-8).toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            {/* Tổng tiền */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                    <CreditCard size={18} /> Tổng thanh toán
                                </span>
                                <span className="text-xl font-bold text-red-600">
                                    {formatCurrency(selectedBooking.totalAmount)}
                                </span>
                            </div>

                            <div className="space-y-6">
                                {/* Thông tin khách hàng */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1 flex items-center gap-2">
                                        <User size={16} className="text-gray-500" /> Khách hàng
                                    </h4>
                                    <div className="grid grid-cols-1 gap-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Họ và tên:</span>
                                            <span className="font-medium text-gray-900">{selectedBooking.customerName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Số điện thoại:</span>
                                            <span className="font-medium text-gray-900">{selectedBooking.customerPhone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Email:</span>
                                            <span className="font-medium text-gray-900">{selectedBooking.customerEmail}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Thông tin phòng */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-3 border-b pb-1 flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-500" /> Chi tiết phòng
                                    </h4>
                                    <div className="space-y-3 text-sm">
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">Loại phòng</p>
                                            <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                                                {selectedBooking.roomTypeName}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-500 text-xs">Số lượng</p>
                                                <p className="font-medium">{selectedBooking.quantity} phòng</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">Số khách</p>
                                                <p className="font-medium">{selectedBooking.numberOfGuests} người</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                                <p className="text-blue-600 text-xs font-semibold mb-1">Nhận phòng</p>
                                                <p className="font-bold text-gray-800">{formatDate(selectedBooking.checkInDate)}</p>
                                            </div>
                                            <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                                                <p className="text-orange-600 text-xs font-semibold mb-1">Trả phòng</p>
                                                <p className="font-bold text-gray-800">{formatDate(selectedBooking.checkOutDate)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Footer */}
                        {/* <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0 z-10">
                            <button
                                onClick={() => navigate(`/admin/bookings/${selectedBooking.id}`)}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                            >
                                Đi đến trang quản lý
                            </button>
                        </div> */}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationPage;