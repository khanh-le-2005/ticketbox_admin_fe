import React, { useState, useEffect } from 'react';
import axiosClient from '@/axiosclient';
import {
  Plus, ShoppingCart, Receipt, LogOut, Search,
  Coffee, CheckCircle, AlertCircle, ClipboardList, Building,
  ArrowRight, RefreshCcw, CreditCard, History
} from 'lucide-react';

import hotelApi from '@/apis/hotelApi';
import { Hotel } from '@/type';

// --- Types Internal (Giữ nguyên) ---
interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface OrderResponse {
  bookingId: string;
  serviceName: string;
  totalAmount: number;
}

interface BillData {
  roomTotal: number;
  serviceTotal: number;
  finalTotal: number;
  usedServices: any[];
}

interface BookingDetail {
  id: string;
  status: string;
  serviceTotalAmount: number;
  grandTotal: number;
  realCheckOutTime: string;
}

const HotelServiceManager: React.FC = () => {
  // --- State (Giữ nguyên logic) ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelId, setHotelId] = useState<string>('');
  const [bookingId, setBookingId] = useState<string>('');
  const [newService, setNewService] = useState({ name: 'Coca Cola', price: 15000, unit: 'Lon' });
  const [menuList, setMenuList] = useState<ServiceItem[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [lastOrder, setLastOrder] = useState<OrderResponse | null>(null);
  const [billData, setBillData] = useState<BillData | null>(null);
  const [bookingDetail, setBookingDetail] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // --- Fetch Hotels (Giữ nguyên logic) ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await hotelApi.getAll({ page: 0, size: 100 });
        const list = res?.data?.content ?? res?.data ?? res?.content ?? [];
        setHotels(list);
        if (list.length > 0) setHotelId(list[0].id);
      } catch (error) {
        console.error("❌ Lỗi tải khách sạn:", error);
        setHotels([]);
      }
    };
    fetchHotels();
  }, []);

  // --- API Handlers (Giữ nguyên logic) ---
  const handleCreateService = async () => {
    if (!hotelId) { setMessage({ type: 'error', text: 'Vui lòng chọn khách sạn trước!' }); return; }
    setLoading(true);
    try {
      const payload = { hotelId, ...newService };
      const res: any = await axiosClient.post('/hotel-services/menu', payload);
      const createdService = res.data?.data || res.data;
      const newItem: ServiceItem = {
        id: createdService.id || createdService,
        name: newService.name,
        price: newService.price,
        unit: newService.unit
      };
      setMenuList([...menuList, newItem]);
      setSelectedServiceId(newItem.id);
      setMessage({ type: 'success', text: `Đã thêm ${newItem.name} vào menu` });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Lỗi: ' + (error.response?.data?.message || error.message) });
    } finally { setLoading(false); }
  };

  const handleOrderService = async () => {
    if (!bookingId || !selectedServiceId) { setMessage({ type: 'error', text: 'Thiếu thông tin đặt món!' }); return; }
    setLoading(true);
    try {
      const res: any = await axiosClient.post(`/hotel-services/order/${bookingId}`, { serviceId: selectedServiceId, quantity: Number(quantity) });
      setLastOrder(res.data?.data || res.data);
      setMessage({ type: 'success', text: 'Đã gọi món thành công!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Lỗi: ' + (error.response?.data?.message || error.message) });
    } finally { setLoading(false); }
  };

  const handleViewBill = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res: any = await axiosClient.get(`/hotel-services/bill/${bookingId}`);
      setBillData(res.data?.data || res.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Lỗi: ' + (error.response?.data?.message || error.message) });
    } finally { setLoading(false); }
  };

  const handleCheckout = async () => {
    if (!bookingId || !window.confirm('Xác nhận trả phòng?')) return;
    setLoading(true);
    try {
      await axiosClient.post(`/hotel-bookings/${bookingId}/check-out`);
      setMessage({ type: 'success', text: 'Check-out hoàn tất!' });
      handleVerifyBooking();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Lỗi: ' + (error.response?.data?.message || error.message) });
    } finally { setLoading(false); }
  };

  const handleVerifyBooking = async () => {
    if (!bookingId) return;
    setLoading(true);
    try {
      const res: any = await axiosClient.get(`/hotel-bookings/${bookingId}`);
      setBookingDetail(res.data?.data || res.data);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Lỗi verify: ' + error.message });
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-sans">
      {/* NỀN TRANG TRÍ PHÍA TRÊN */}
      <div className="h-64 bg-slate-900 w-full absolute top-0 left-0 z-0 shadow-lg"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-10 ">
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 text-white px-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500 rounded-2xl shadow-lg shadow-blue-500/20">
              <ClipboardList size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Hotel Operations</h1>
              <p className="text-blue-100 opacity-80">Quản lý dịch vụ & Quy trình trả phòng</p>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex gap-2">
            {loading && <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm">
              <RefreshCcw size={16} className="animate-spin" /> Đang xử lý...
            </div>}
          </div>
        </header>

        {/* CẤU HÌNH CHUNG - STICKY BAR */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white/40 mb-8 sticky top-4 z-50 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Cơ sở khách sạn</label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <select
                value={hotelId}
                onChange={e => setHotelId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all cursor-pointer shadow-sm"
              >
                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mã đặt phòng (Active)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={bookingId}
                onChange={e => setBookingId(e.target.value)}
                placeholder="Nhập Booking ID để bắt đầu..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm font-mono"
              />
            </div>
          </div>
        </div>

        {/* MESSAGE AREA */}
        {message && (
          <div className={`mb-8 p-4 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
            }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* CỘT TRÁI: NGHIỆP VỤ (8 CỘT) */}
          <div className="lg:col-span-8 space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* BƯỚC 1: MENU */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Coffee size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">1. Thiết lập Menu</h2>
                </div>
                <div className="space-y-4">
                  <input
                    placeholder="Tên món (VD: Snack, Coca...)"
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                    className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number" placeholder="Giá"
                      value={newService.price}
                      onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
                      className="w-1/2 p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <input
                      placeholder="ĐVT"
                      value={newService.unit}
                      onChange={e => setNewService({ ...newService, unit: e.target.value })}
                      className="w-1/2 p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleCreateService}
                    disabled={loading}
                    className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Thêm vào Menu
                  </button>
                </div>
              </section>

              {/* BƯỚC 2: ORDER */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <ShoppingCart size={22} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">2. Gọi dịch vụ</h2>
                </div>
                {menuList.length === 0 ? (
                  <div className="h-[188px] flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 italic text-sm">
                    Chưa có món nào
                  </div>
                ) : (
                  <div className="space-y-4">
                    <select
                      value={selectedServiceId}
                      onChange={e => setSelectedServiceId(e.target.value)}
                      className="w-full p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                    >
                      {menuList.map(item => (
                        <option key={item.id} value={item.id}>{item.name} ({formatCurrency(item.price)})</option>
                      ))}
                    </select>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <span className="text-sm font-bold text-slate-500 uppercase">Số lượng</span>
                      <input
                        type="number" min="1"
                        value={quantity}
                        onChange={e => setQuantity(Number(e.target.value))}
                        className="w-16 bg-transparent text-right font-bold text-lg outline-none"
                      />
                    </div>
                    <button
                      onClick={handleOrderService}
                      disabled={loading}
                      className="w-full py-3 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      Xác nhận Order <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </section>
            </div>

            {/* BƯỚC 5: VERIFY (KẾT QUẢ CUỐI) */}
            {bookingDetail && (
              <section className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                  <History size={120} />
                </div>
                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle size={18} />
                    </div>
                    <h2 className="text-xl font-bold">Lịch sử hệ thống</h2>
                  </div>
                  <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${bookingDetail.status === 'CHECKED_OUT' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}>
                    {bookingDetail.status}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs uppercase font-bold">Dịch vụ phát sinh</p>
                    <p className="text-2xl font-light tracking-tight">{formatCurrency(bookingDetail.serviceTotalAmount)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs uppercase font-bold">Tổng quyết toán</p>
                    <p className="text-3xl font-black text-emerald-400 tracking-tighter">{formatCurrency(bookingDetail.grandTotal)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-400 text-xs uppercase font-bold">Thời gian Check-out</p>
                    <p className="text-sm font-mono opacity-80">{bookingDetail.realCheckOutTime || 'N/A'}</p>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* CỘT PHẢI: HÓA ĐƠN & CHECKOUT (4 CỘT) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden sticky top-32">
              <div className="bg-indigo-600 p-6 text-white text-center">
                <Receipt className="mx-auto mb-2" size={32} />
                <h2 className="text-xl font-bold">Hóa đơn tạm tính</h2>
                <p className="text-indigo-100 text-sm opacity-80">Booking: {bookingId || '---'}</p>
              </div>

              <div className="p-6 space-y-6">
                <button
                  onClick={handleViewBill}
                  className="w-full py-3 border-2 border-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Search size={18} /> Kiểm tra phí
                </button>

                {billData ? (
                  <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-500">
                        <span>Tiền phòng:</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(billData.roomTotal)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Dịch vụ:</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(billData.serviceTotal)}</span>
                      </div>
                    </div>

                    {billData.usedServices.length > 0 && (
                      <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                        {billData.usedServices.map((s, i) => (
                          <div key={i} className="flex justify-between text-[11px] text-slate-400 uppercase font-bold">
                            <span>{s.serviceName} x{s.quantity}</span>
                            <span>{formatCurrency(s.totalAmount || 0)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-4 border-t-2 border-dashed border-slate-100">
                      <div className="flex justify-between items-end">
                        <span className="text-slate-400 font-bold uppercase text-xs">Phải thanh toán</span>
                        <span className="text-3xl font-black text-indigo-700 tracking-tighter">
                          {formatCurrency(billData.finalTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-10 text-center text-slate-300 italic text-sm">
                    Nhấn nút phía trên để tải hóa đơn
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={handleCheckout}
                    disabled={loading || !bookingId}
                    className="w-full py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 shadow-lg shadow-rose-200 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-slate-200 disabled:shadow-none"
                  >
                    <LogOut size={22} /> XÁC NHẬN TRẢ PHÒNG
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HotelServiceManager;