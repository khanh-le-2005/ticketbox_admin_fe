import React, { useEffect, useState, useRef } from 'react';
import SockJS from 'sockjs-client';
import Stomp from 'stompjs';
import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCheck, DollarSign, XCircle, Info, Loader2
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
  const handleClickItem = async (notif: Notification) => {
    try {
      setIsOpen(false); // Đóng dropdown thông báo

      if (notif.targetUrl && notif.targetUrl.includes('/hotel-bookings/')) {
        const bookingId = notif.targetUrl.split('/').pop();
        if (bookingId) {
          setIsLoading(true);
          try {
            const res: any = await axiosClient.get(`/hotel-bookings/${bookingId}`);
            setSelectedBooking({ ...res.data || res, notifId: notif.id, isRead: notif.read });
            setIsModalOpen(true); // Mở Modal khi có dữ liệu
          } catch (apiErr) {
            console.error("Lỗi lấy chi tiết:", apiErr);
            navigate(notif.targetUrl);
          } finally {
            setIsLoading(false);
          }
        }
      } else {
        // Logic cho các loại thông báo khác
        if (!notif.read) markAsRead(notif.id);
        if (notif.targetUrl) navigate(notif.targetUrl);
      }
    } catch (error) { console.error(error); }
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
                        onClick={() => handleClickItem(notif)} // Vẫn giữ click vào cả row để xem
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

                            {/* NÚT XEM THÊM - CHỈ HIỆN KHI CÓ LINK BOOKING */}
                            {/* {(notif.targetUrl?.includes('bookings') || notif.type === 'NEW_BOOKING') && (
                              <button
                                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleClickItem(notif);
                                }}
                              >
                                Xem thêm →
                              </button>
                            )} */}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-50 bg-gray-50">
              <button className="w-full py-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition-colors bg-white border border-gray-200 rounded-lg shadow-sm" onClick={() => { setIsOpen(false); navigate('/notifications'); }}>
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
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Mã đơn hàng</p>
                  <p className="font-semibold text-blue-600">#{selectedBooking.id?.slice(-8).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-500">Trạng thái</p>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[11px] font-bold">
                    {selectedBooking.status || 'ĐÃ XÁC NHẬN'}
                  </span>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-gray-500">Khách hàng</p>
                  <p className="font-medium">{selectedBooking.customerName || 'N/A'}</p>
                </div>
                <div className="col-span-2 border-t pt-2">
                  <p className="text-gray-500">Nội dung chi tiết</p>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg italic">
                    {selectedBooking.note || 'Không có ghi chú thêm cho đơn hàng này.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              {!selectedBooking.isRead && (
                <button
                  onClick={async () => {
                    await markAsRead(selectedBooking.notifId);
                    setIsModalOpen(false);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                >
                  <CheckCheck size={18} /> Xác nhận đã đọc
                </button>
              )}
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  navigate(`/admin/bookings/${selectedBooking.id}`);
                }}
                className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all"
              >
                Xem trên hệ thống
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;