import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, DollarSign, XCircle, Info, Loader2,
  Calendar, User, CreditCard, Copy
} from 'lucide-react';
import axiosClient from '@/axiosclient';

// --- FIX 1: Polyfill cho biến global (Bắt buộc với React/Vite để tránh lỗi ngầm) ---
if (typeof global === 'undefined') {
  (window as any).global = window;
}

// --- CONFIG ---
const WS_ENDPOINT = 'https://api.momangshow.vn/api/ws-notifications';
console.log(WS_ENDPOINT);
interface Notification {
  id: string;
  recipientId: string;
  title: string;
  content: string;
  targetUrl: string;
  type: 'NEW_BOOKING' | 'CHECKOUT_TODAY' | 'CANCELLED' | 'SYSTEM';
  read: boolean;
  createdAt: string;
}

const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (userStr && userStr !== "undefined") {
      const user = JSON.parse(userStr);
      return user.id || user.userId || user._id || null;
    }
  } catch (error) {
    // console.error("Lỗi parsing user:", error);
  }
  return null;
};

const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedBooking, setSelectedBooking] = useState<any>(null); // Lưu thông tin đơn hàng
  const [isModalOpen, setIsModalOpen] = useState(false); // Trạng thái đóng mở modal

  const stompClientRef = useRef<Stomp.Client | null>(null);
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'NEW_BOOKING': return { icon: <DollarSign size={18} />, color: 'text-green-600', bg: 'bg-green-100' };
      case 'CHECKOUT_TODAY': return { icon: <Bell size={18} />, color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 'CANCELLED': return { icon: <XCircle size={18} />, color: 'text-red-600', bg: 'bg-red-100' };
      default: return { icon: <Info size={18} />, color: 'text-blue-600', bg: 'bg-blue-100' };
    }
  };

  const fetchUnreadCount = async () => {
    if (!userId) return;
    try {
      const res: any = await axiosClient.get('/notifications/unread-count');
      setUnreadCount(Number(res.data ?? res));
    } catch (error) {
      console.error("Lỗi fetch count:", error);
    }
  };

  const fetchNotifications = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res: any = await axiosClient.get('/notifications?page=0&size=10');
      const dataList = res.content || res.data || res;
      if (Array.isArray(dataList)) setNotifications(dataList);
    } catch (error) {
      console.error("Lỗi fetch list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- WEBSOCKET LOGIC ---
  useEffect(() => {
    if (!userId) return;

    fetchUnreadCount();

    // --- FIX 2: Cấu hình Transports để chặn Iframe ---
    // Chỉ cho phép WebSocket hoặc XHR Polling. 
    // Điều này ngăn chặn lỗi "X-Frame-Options" và "404" đỏ lòm console.
    const socket = new SockJS(WS_ENDPOINT, null, {
      transports: ['websocket', 'xhr-polling']
    });

    const client = Stomp.over(socket);

    // Tắt log debug rác trong console
    client.debug = () => { };

    // Header kết nối rỗng (theo yêu cầu của bạn)
    client.connect({},
      (frame) => {
        console.log('✅ [WebSocket] Kết nối thành công!', frame);
        // console.log('✅ Connected WS');
        client.subscribe(`/topic/notifications/${userId}`, (message) => {
          if (message.body) {
            const newNotif: Notification = JSON.parse(message.body);

            // --- FIX 3: Chặn Duplicate Key (Lỗi React) ---
            setNotifications(prev => {
              // Kiểm tra xem tin nhắn này đã có trong list chưa
              const isExist = prev.some(item => item.id === newNotif.id);
              if (isExist) return prev; // Nếu có rồi thì không thêm nữa

              return [newNotif, ...prev];
            });

            // Tăng số lượng chưa đọc
            setUnreadCount(prev => prev + 1);

            // Audio
            new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
              .play().catch(() => { });
          }
        });
      },
      (error) => {
        // Log lỗi nhẹ nhàng hơn
        console.warn('WS Connection Failed (Retrying in background...)');
      }
    );

    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        stompClientRef.current.disconnect(() => { });
      }
    };
  }, [userId]);

  // --- HANDLERS ---
  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) fetchNotifications();
  };

  // --- HANDLERS ---
  // const handleClickItem = async (notif: Notification) => {
  //   try {
  //     // 1. Đánh dấu đã đọc (Giữ nguyên logic cũ)
  //     if (!notif.read) {
  //       await axiosClient.put(`/notifications/${notif.id}/read`);
  //       setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
  //       setUnreadCount(prev => Math.max(0, prev - 1));
  //     }

  //     setIsOpen(false);

  //     // 2. XỬ LÝ LẤY CHI TIẾT BOOKING
  //     if (notif.targetUrl && notif.targetUrl.includes('/hotel-bookings/')) {
  //       // Trích xuất ID từ chuỗi, ví dụ: "/hotel-bookings/6789" -> "6789"
  //       const bookingId = notif.targetUrl.split('/').pop();

  //       if (bookingId) {
  //         try {
  //           // Gọi API chi tiết theo base url đã cấu hình trong axiosClient
  //           const res: any = await axiosClient.get(`/hotel-bookings/${bookingId}`);
  //           const bookingDetail = res.data || res;

  //           console.log("Dữ liệu chi tiết Booking:", bookingDetail);

  //           // Tùy chọn: Bạn có thể điều hướng hoặc mở một Modal chi tiết ở đây
  //           // Ví dụ: điều hướng tới trang chi tiết thực tế trên giao diện
  //           navigate(`/admin/bookings/${bookingId}`, { state: { detail: bookingDetail } });

  //         } catch (apiErr) {
  //           console.error("Không thể lấy chi tiết booking:", apiErr);
  //           // Nếu lỗi API vẫn cho navigate theo link gốc của notif
  //           navigate(notif.targetUrl);
  //         }
  //       }
  //     } else if (notif.targetUrl) {
  //       // Nếu là các loại link khác thì chuyển hướng bình thường
  //       navigate(notif.targetUrl);
  //     }
  //   } catch (error) {
  //     console.error("Lỗi xử lý click thông báo:", error);
  //   }
  // };
  // Sửa lại khai báo hàm nhận thêm tham số 'e'
  const handleClickItem = async (notif: Notification, e?: React.MouseEvent) => {
    // 1. Log ngay khi click để xem sự kiện có bắt được không
    console.log("🚀 [START] Đã click vào thông báo:", notif);

    try {
      setIsOpen(false); // Đóng dropdown

      // Kiểm tra URL
      console.log("🔍 [CHECK] Target URL:", notif.targetUrl);

      const isBookingUrl = notif.targetUrl.includes('/bookings/');

      if (isBookingUrl) {

        // Cắt chuỗi để lấy ID
        // Logic mới: Xóa dấu gạch chéo cuối cùng nếu có để tránh lỗi chuỗi rỗng
        const cleanUrl = notif.targetUrl.replace(/\/+$/, '');
        const bookingId = cleanUrl.split('/').pop();

        if (bookingId && bookingId !== 'hotel-bookings') {
          setIsLoading(true);

          try {
            const res: any = await axiosClient.get(`/hotel-bookings/${bookingId}`);

            // Kiểm tra cấu trúc dữ liệu trước khi set state
            const bookingData = res.data || res;

            if (bookingData) {

              setSelectedBooking({
                ...bookingData,
                notifId: notif.id,
                isRead: notif.read
              });
              // Mở Modal
              setIsModalOpen(true);
            } else {
              navigate(notif.targetUrl);
            }
          } catch (apiErr) {
            // Nếu lỗi API thì chuyển trang thường
            navigate(notif.targetUrl);
          } finally {
            setIsLoading(false);
          }
        } else {
          navigate(notif.targetUrl);
        }
      } else {
        if (!notif.read) markAsRead(notif.id);
        if (notif.targetUrl) navigate(notif.targetUrl);
      }
    } catch (error) {
    }
  };

  // --- Helpers ---
  const formatCurrency = (val: any) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  const extractBookingCode = (content: string) => {
    if (!content) return null;
    const match = content.match(/Mã:\s*([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(`Đã sao chép mã: ${code}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CANCELLED': return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-bold border border-red-200 uppercase">Đã hủy</span>;
      case 'CHECKED_OUT': return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold border border-gray-200 uppercase">Đã trả phòng</span>;
      case 'CONFIRMED': return <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold border border-green-200 uppercase">Đã xác nhận</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-[10px] font-bold border border-yellow-200 uppercase">Chờ thanh toán</span>;
      default: return <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{status || 'ĐÃ XÁC NHẬN'}</span>;
    }
  };

  // Hàm phụ để xử lý đánh dấu đã đọc
  const markAsRead = async (id: string) => {
    try {
      await axiosClient.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error(err); }
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axiosClient.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="relative inline-block text-left">
      <button onClick={handleToggle} className="relative p-2 rounded-full hover:bg-gray-100 transition-all outline-none">
        <Bell className="w-6 h-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-[70] overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white">
              <span className="text-sm font-bold text-gray-900">Thông báo mới nhất (Chỉ dành cho khách sạn)</span>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-[11px] flex items-center text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-md transition-colors">
                  <CheckCheck className="w-3.5 h-3.5 mr-1" /> Đánh dấu đã đọc
                </button>
              )}
            </div>

            <div className="max-h-[420px] overflow-y-auto scrollbar-hide">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="mt-2 text-xs text-gray-400">Đang tải tin nhắn...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-500">Bạn chưa có thông báo nào</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifications.map((notif) => {
                    const { icon, color, bg } = getNotificationConfig(notif.type);
                    return (
                      <div
                        key={notif.id}
                        className={`group relative flex p-4 hover:bg-gray-50 cursor-pointer transition-all gap-4 ${!notif.read ? 'bg-blue-50/30' : ''}`}
                        onClick={(e) => handleClickItem(notif, e)} // Vẫn giữ click vào cả row để xem
                      >
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${bg} ${color}`}>
                          {icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className={`text-sm leading-tight line-clamp-1 ${!notif.read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </p>
                            {!notif.read && <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                          </div>

                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {notif.content}
                          </p>

                          <div className="flex justify-between items-center mt-2">
                            <p className="text-[10px] text-gray-400 font-medium">
                              {new Date(notif.createdAt).toLocaleString('vi-VN')}
                            </p>

                            <div className="flex items-center gap-2">
                              {extractBookingCode(notif.content) && (
                                <button
                                  className="text-[10px] font-bold text-gray-500 hover:text-gray-700 flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyCode(extractBookingCode(notif.content)!);
                                  }}
                                  title="Sao chép mã phòng"
                                >
                                  <Copy size={12} /> Copy Mã
                                </button>
                              )}

                              {/* NÚT XEM THÊM - CHỈ HIỆN KHI CÓ LINK BOOKING */}
                              {(notif.targetUrl?.includes('bookings') || notif.type === 'NEW_BOOKING') && (
                                <button
                                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClickItem(notif, e);
                                  }}
                                >
                                  Xem thêm →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-50 bg-gray-50">
              <button className="w-full py-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm" onClick={() => { setIsOpen(false); navigate('/notificationPage'); }}>
                Xem tất cả thông báo
              </button>
            </div>
          </div>
        </>
      )}
      {/* MODAL CHI TIẾT ĐƠN HÀNG */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Info className="text-blue-500" size={20} /> Chi tiết đơn hàng
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                <XCircle className="text-gray-400" size={24} />
              </button>
            </div>

            {/* Body - Hiển thị dữ liệu từ API hotel-bookings */}
            <div className="p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              {/* Tên khách sạn & Trạng thái */}
              <div className="mb-5 text-center">
                <h2 className="text-lg font-bold text-blue-900 uppercase leading-snug">
                  {selectedBooking.hotelName || 'THÔNG TIN ĐƠN HÀNG'}
                </h2>
                <div className="mt-2 flex justify-center items-center gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  <span className="text-[10px] text-gray-400 px-2 py-1 bg-gray-50 rounded border border-gray-100">
                    #{selectedBooking.id?.slice(-8).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Tổng tiền */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex justify-between items-center">
                <span className="text-xs font-medium text-blue-800 flex items-center gap-2">
                  <CreditCard size={16} /> Tổng thanh toán
                </span>
                <span className="text-lg font-bold text-red-600">
                  {formatCurrency(selectedBooking.totalAmount || 0)}
                </span>
              </div>

              <div className="space-y-6">
                {/* Thông tin khách hàng */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-3 border-b pb-1 flex items-center gap-2">
                    <User size={14} className="text-gray-500" /> Khách hàng
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs">
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
                      <span className="font-medium text-gray-900 line-clamp-1">{selectedBooking.customerEmail}</span>
                    </div>
                  </div>
                </div>

                {/* Thông tin phòng */}
                <div>
                  <h4 className="text-xs font-bold text-gray-900 mb-3 border-b pb-1 flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" /> Chi tiết phòng
                  </h4>
                  <div className="space-y-3 text-xs">
                    <div>
                      <p className="text-gray-500 text-[10px] mb-1">Loại phòng</p>
                      <p className="font-medium text-gray-800 bg-gray-50 p-2 rounded border border-gray-100">
                        {selectedBooking.roomTypeName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-500 text-[10px]">Số lượng</p>
                        <p className="font-medium">{selectedBooking.quantity} phòng</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px]">Số khách</p>
                        <p className="font-medium">{selectedBooking.numberOfGuests} người</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div className="bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                        <p className="text-blue-600 text-[10px] font-semibold mb-0.5">Nhận phòng</p>
                        <p className="font-bold text-gray-800">{formatDate(selectedBooking.checkInDate)}</p>
                      </div>
                      <div className="bg-orange-50/50 p-2.5 rounded-lg border border-orange-100">
                        <p className="text-orange-600 text-[10px] font-semibold mb-0.5">Trả phòng</p>
                        <p className="font-bold text-gray-800">{formatDate(selectedBooking.checkOutDate)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ghi chú */}
                {selectedBooking.note && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <Info size={14} className="text-gray-500" /> Ghi chú
                    </h4>
                    <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-lg italic border border-gray-100">
                      {selectedBooking.note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">
              <div className="flex gap-2">
                {!selectedBooking.isRead && (
                  <button
                    onClick={async () => {
                      await markAsRead(selectedBooking.notifId);
                      setIsModalOpen(false);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <CheckCheck size={14} /> Xác nhận đã đọc
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate(`/admin/bookings/${selectedBooking.id}`);
                  }}
                  className="flex-1 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-bold text-xs transition-all"
                >
                  Xem trên hệ thống
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full py-2 text-gray-500 hover:text-gray-700 font-medium text-[10px] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;