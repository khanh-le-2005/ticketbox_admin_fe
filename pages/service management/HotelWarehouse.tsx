import React, { useState, useEffect } from 'react';
import axiosClient from '@/axiosclient';
import {
  Plus, ShoppingCart, Receipt, LogOut, Search,
  Coffee, CheckCircle, AlertCircle, ClipboardList, Building,
  ArrowRight, RefreshCcw, History, User, CreditCard, Wallet
} from 'lucide-react';
import hotelApi from '@/apis/hotelApi';
import { Hotel } from '@/type';
import { toast } from 'react-toastify';

interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
  hotelId: string;
  active: boolean;
}

interface ActiveGuest {
  id: string;
  customerName: string;
  roomNumber: string;
  checkInDate: string;
}

interface UsedService {
  id: string;
  serviceId: string;
  serviceName: string;
  priceAtOrder: number;
  quantity: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: 'PAID' | 'UNPAID';
  createdAt: string;
}

interface BillData {
  bookingInfo: {
    id: string;
    customerName: string;
    assignedRoomNumbers: string;
  };
  usedServices: UsedService[];
  roomTotal: number;
  serviceTotal: number;
  finalTotal: number;
}

const HotelServiceManager: React.FC = () => {
  // --- State ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<string>('');
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([]);
  const [bookingId, setBookingId] = useState<string>('');

  // State Form
  const [menuList, setMenuList] = useState<ServiceItem[]>([]);

  // State Order
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('CHARGE_TO_ROOM');

  const [billData, setBillData] = useState<BillData | null>(null);
  const [loading, setLoading] = useState(false);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // 1. Fetch Hotels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await hotelApi.getAll({ page: 0, size: 100 });
        const list = res?.data?.content ?? res?.data ?? res?.content ?? [];
        setHotels(list);
        if (list.length > 0) setHotelId(list[0].id);
      } catch (error) { console.error(error); }
    };
    fetchHotels();
  }, []);

  // 2. Fetch Data khi đổi Hotel
  // ... (giữ nguyên các phần trên)

  // 2. Fetch Data khi đổi Hotel
  useEffect(() => {
    if (!hotelId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // --- Fetch Menu (Giữ nguyên) ---
        const menuRes: any = await axiosClient.get(`/hotel-services/menu/${hotelId}`);
        const menuData = menuRes.data?.data || menuRes.data || [];
        setMenuList(menuData);
        if (menuData.length > 0) setSelectedServiceId(menuData[0].id);

        // --- Fetch Active Guests (SỬA PHẦN NÀY) ---
        const guestRes: any = await axiosClient.get(`/hotel-services/active-guests/${hotelId}`);
        const guestData = guestRes.data?.data || guestRes.data || [];

        console.log("🔥 Dữ liệu API Active Guests trả về:", guestData); // Kiểm tra log này ở F12

        const mappedGuests = guestData.map((g: any) => ({
          // SỬA QUAN TRỌNG: Kiểm tra kỹ trường ID, nếu không có id thì tìm bookingId
          id: g.id || g.bookingId || "",
          customerName: g.customerName || "Khách lẻ",
          roomNumber: g.assignedRoomNumbers || g.roomNumber || '?', // Map thêm trường roomNumber
          checkInDate: g.checkInDate
        }));

        // Lọc bỏ những dòng không có ID để tránh lỗi option value undefined
        const validGuests = mappedGuests.filter((g: any) => g.id !== "");

        setActiveGuests(validGuests);

        // Tự động chọn khách đầu tiên nếu chưa chọn
        if (validGuests.length > 0) {
          setBookingId(validGuests[0].id);
        } else {
          setBookingId('');
        }

      } catch (error) {
        console.error(error);
        setActiveGuests([]);
        setBookingId('');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hotelId]);

  // 3. Effect phụ: Đảm bảo nếu có list khách mà bookingId rỗng thì chọn lại cái đầu tiên
  useEffect(() => {
    if (activeGuests.length > 0 && !bookingId) {
      setBookingId(activeGuests[0].id);
    }
  }, [activeGuests]);

  // Tự động load bill khi có bookingId
  useEffect(() => {
    if (bookingId) {
      handleViewBill();
    } else {
      setBillData(null);
    }
  }, [bookingId]);

  // --- ACTIONS ---

  const handleOrderService = async () => {
    if (!bookingId) { toast.warning('Chưa chọn phòng nào!'); return; }
    if (!selectedServiceId) { toast.warning('Chưa chọn món!'); return; }

    setLoading(true);
    try {
      const payload = {
        serviceId: selectedServiceId,
        quantity: Number(quantity),
        paymentMethod: paymentMethod
      };

      await axiosClient.post(`/hotel-services/order/${bookingId}`, payload);

      toast.success('Đã thêm món thành công!');
      handleViewBill();
    } catch (error: any) {
      toast.error('Lỗi order: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleViewBill = async () => {
    if (!bookingId) return;
    try {
      const res: any = await axiosClient.get(`/hotel-services/bill/${bookingId}`);
      setBillData(res.data?.data || res.data);
    } catch (error) { console.error(error); }
  };

  const handleCheckout = async () => {
    if (!bookingId || !confirm('Xác nhận trả phòng?')) return;
    setLoading(true);
    try {
      await axiosClient.post(`/hotel-bookings/${bookingId}/check-out`);
      toast.success('Checkout thành công');

      // Xóa khách khỏi danh sách và reset
      const updatedGuests = activeGuests.filter(g => g.id !== bookingId);
      setActiveGuests(updatedGuests);

      if (updatedGuests.length > 0) setBookingId(updatedGuests[0].id);
      else setBookingId('');

      setBillData(null);
    } catch (error) { toast.error('Lỗi checkout'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      <div className="h-64 bg-slate-900 w-full absolute top-0 left-0 z-0 shadow-lg"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 ">
        {/* Header */}
        <header className="flex justify-between mb-10 text-white px-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl"><ClipboardList size={32} /></div>
            <div><h1 className="text-3xl font-bold">Hotel Services</h1></div>
          </div>
        </header>

        {/* SELECT HOTEL & ROOM */}
        <div className="bg-white p-4 rounded-2xl shadow-xl mb-8 grid grid-cols-2 gap-6 sticky top-4 z-50">
          <div>
            <label className="text-xs font-bold text-slate-400">KHÁCH SẠN</label>
            <select value={hotelId} onChange={e => setHotelId(e.target.value)} className="w-full p-3 border rounded-xl font-bold">
              {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400">PHÒNG ĐANG PHỤC VỤ ({activeGuests.length})</label>
            <select
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              className="w-full p-3 border rounded-xl font-bold text-indigo-700"
            >
              {/* Option rỗng để tránh hiển thị sai tên khi chưa có ID */}
              <option value="" disabled>-- Chọn phòng khách --</option>

              {activeGuests.map(g => (
                <option key={g.id} value={g.id}>Phòng {g.roomNumber} - {g.customerName}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          <div className="lg:col-span-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">



              {/* CARD 2: ORDER DỊCH VỤ */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Order Dịch Vụ</h2>
                    <p className="text-xs text-slate-400">Thêm vào hóa đơn phòng</p>
                  </div>
                </div>

                {menuList.length === 0 ? (
                  <div className="text-center text-slate-400 italic">Chưa có menu</div>
                ) : (
                  <div className="space-y-4">
                    {/* 1. Chọn món */}
                    <select
                      value={selectedServiceId}
                      onChange={e => setSelectedServiceId(e.target.value)}
                      className="w-full p-3 bg-slate-50 border-none rounded-xl font-medium outline-none"
                    >
                      {menuList.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - {formatCurrency(item.price)}
                        </option>
                      ))}
                    </select>

                    {/* 2. Chọn Số lượng */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-500 uppercase">Số lượng</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-bold">-</button>
                        <span className="w-8 text-center font-bold text-lg">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 bg-white rounded shadow-sm hover:bg-slate-200 font-bold">+</button>
                      </div>
                    </div>

                    {/* 3. Chọn Phương thức thanh toán */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setPaymentMethod('CHARGE_TO_ROOM')}
                        className={`p-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === 'CHARGE_TO_ROOM'
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                          }`}
                      >
                        <CreditCard size={18} />
                        GHI NỢ PHÒNG
                      </button>
                      <button
                        onClick={() => setPaymentMethod('PAY_IMMEDIATELY')}
                        className={`p-3 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border-2 transition-all ${paymentMethod === 'PAY_IMMEDIATELY'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                          }`}
                      >
                        <Wallet size={18} />
                        THANH TOÁN NGAY
                      </button>
                    </div>

                    {/* 4. Nút Submit */}
                    <button
                      onClick={handleOrderService}
                      disabled={loading || !bookingId}
                      className={`w-full py-3 text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all ${loading || !bookingId
                        ? 'bg-slate-300 shadow-none cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 shadow-amber-200 active:scale-95'
                        }`}
                    >
                      {loading ? <RefreshCcw className="animate-spin" size={18} /> : <Plus size={18} />}
                      {paymentMethod === 'PAY_IMMEDIATELY' ? 'Thu tiền & Xuất món' : 'Thêm vào Hóa đơn'}
                    </button>
                  </div>
                )}
              </section>
            </div>
          </div>

          {/* RIGHT COLUMN: HÓA ĐƠN */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden sticky top-32">
              {/* Header Hóa đơn */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-white text-center">
                <Receipt className="mx-auto mb-2" size={32} />
                <h2 className="text-xl font-bold">Chi tiết Hóa đơn</h2>
                <p className="text-xs opacity-80 mt-1">
                  {bookingId ? `Phòng: ${activeGuests.find(g => g.id === bookingId)?.roomNumber || '...'}` : 'Chưa chọn phòng'}
                </p>
              </div>

              <div className="p-6">
                {/* Nút Cập nhật */}
                <button onClick={handleViewBill} className="w-full mb-4 py-2 border rounded-lg flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-50">
                  <RefreshCcw size={14} /> Cập nhật
                </button>

                {/* List Item */}
                <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {billData?.usedServices?.length ? (
                    billData.usedServices.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-start border-b pb-2 last:border-0">
                        <div>
                          <div className="font-bold text-sm text-slate-700">{s.serviceName}</div>
                          <div className="text-xs text-slate-400">
                            SL: {s.quantity} | {s.paymentStatus === 'PAID' ? <span className="text-emerald-500 font-bold">Đã TT</span> : <span className="text-rose-500 font-bold">Ghi nợ</span>}
                          </div>
                        </div>
                        <div className="font-bold text-slate-700">{formatCurrency(s.totalAmount)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-300 italic py-4">
                      {bookingId ? 'Chưa có dữ liệu' : 'Vui lòng chọn phòng'}
                    </div>
                  )}
                </div>

                {/* Tổng tiền */}
                {billData && (
                  <div className="pt-4 border-t-2 border-dashed">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Tiền dịch vụ:</span>
                      <span className="font-bold text-slate-700">{formatCurrency(billData.serviceTotal)}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="font-bold uppercase text-xs">Tổng cộng</span>
                      <span className="text-2xl font-black text-indigo-700">{formatCurrency(billData.finalTotal)}</span>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={!bookingId}
                  className="w-full mt-6 py-4 bg-rose-600 text-white font-black rounded-xl shadow-lg hover:bg-rose-700 disabled:bg-slate-200 disabled:shadow-none"
                >
                  TRẢ PHÒNG & THANH TOÁN
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HotelServiceManager;