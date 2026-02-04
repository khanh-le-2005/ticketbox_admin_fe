import React, { useState, useEffect } from 'react';
import {
    FaUser, FaPhone, FaCalendarAlt, FaHotel, FaBed,
    FaMoneyBillWave, FaStickyNote, FaSave, FaSpinner, FaUsers,
    FaChevronLeft, FaInfoCircle, FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '@/axiosclient';
import hotelApi from '@/apis/hotelApi';
import { Hotel } from '@/type';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface ManualBookingForm {
    hotelId: string;
    roomTypeCode: string;
    quantity: number;
    numberOfGuests: number;
    checkInDate: string;
    checkOutDate: string;
    customerName: string;
    customerPhone: string;
    customPrice: number;
    note: string;
}

const ManualBookingPage: React.FC = () => {
    const navigate = useNavigate(); // Thêm navigate để xử lý nút quay lại
    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loadingHotels, setLoadingHotels] = useState(true);
    const location = useLocation();

    // Initial State
    const [formData, setFormData] = useState<ManualBookingForm>({
        hotelId: '',
        roomTypeCode: '',
        quantity: 1,
        numberOfGuests: 2,
        checkInDate: '',
        checkOutDate: '',
        customerName: '',
        customerPhone: '',
        customPrice: 0,
        note: ''
    });

    // --- LOGIC JS GIỮ NGUYÊN ---
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res: any = await hotelApi.getAll();
                const list = res?.content || res?.data?.content || res?.data?.data?.content || [];
                setHotels(list);
            } catch (e) {
                console.error("Fetch hotels error:", e);
                setHotels([]);
            } finally {
                setLoadingHotels(false);
            }
        };
        fetchHotels();
    }, []);

    useEffect(() => {
        if (location.state) {
            const stateData = location.state as any;
            const rawStart = stateData.start || stateData.date;
            const rawEnd = stateData.end;
            let newCheckIn = '';
            let newCheckOut = '';
            if (rawStart) {
                newCheckIn = format(new Date(rawStart), 'yyyy-MM-dd');
                if (rawEnd) {
                    newCheckOut = format(new Date(rawEnd), 'yyyy-MM-dd');
                } else {
                    const nextDay = new Date(rawStart);
                    nextDay.setDate(nextDay.getDate() + 1);
                    newCheckOut = format(nextDay, 'yyyy-MM-dd');
                }
            }
            setFormData(prev => ({
                ...prev,
                hotelId: stateData.hotelId ? String(stateData.hotelId) : prev.hotelId,
                checkInDate: newCheckIn || prev.checkInDate,
                checkOutDate: newCheckOut || prev.checkOutDate,
            }));
        }
    }, [location.state]);

    useEffect(() => {
        const stateData = location.state as any;
        if (stateData?.roomId && hotels.length > 0 && formData.hotelId) {
            const targetHotel = hotels.find(h => String(h.id) === String(formData.hotelId));
            if (targetHotel?.roomTypes) {
                for (const rt of targetHotel.roomTypes) {
                    const hasRoom = rt.rooms?.some((r: any) => String(r.id) === String(stateData.roomId));
                    if (hasRoom) {
                        setFormData(prev => ({ ...prev, roomTypeCode: rt.code }));
                        break;
                    }
                }
            }
        }
    }, [hotels, formData.hotelId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: (name === 'quantity' || name === 'numberOfGuests' || name === 'customPrice')
                    ? Number(value) : value
            };
            if (name === 'hotelId') newData.roomTypeCode = '';
            return newData;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.hotelId || !formData.roomTypeCode || !formData.customerName || !formData.checkInDate || !formData.checkOutDate) {
            toast.warn("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
            return;
        }
        try {
            setLoading(true);
            const payload = { ...formData, quantity: Number(formData.quantity), numberOfGuests: Number(formData.numberOfGuests), customPrice: Number(formData.customPrice) };
            await axiosClient.post('/hotel-bookings/manual', payload);
            toast.success("✅ Tạo đơn đặt phòng thành công!");
            setFormData(prev => ({ ...prev, customerName: '', customerPhone: '', note: '', customPrice: 0 }));
        } catch (error: any) {
            const msg = error?.response?.data?.message || error?.message || "Lỗi khi tạo đơn hàng";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };
    // --- HẾT LOGIC JS ---

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-700">
            <div className="max-w-5xl mx-auto">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
                        >
                            <FaChevronLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <span className="text-indigo-600">Đặt Phòng Thủ Công</span> <FaHotel className="text-indigo-600" />
                            </h1>
                            <p className="text-slate-500 text-sm font-medium">Tạo đơn hàng nội bộ cho khách lẻ & đối tác</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-xs font-bold uppercase tracking-wider">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                        Hệ thống nội bộ (PMS)
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* SECTION 1: THÔNG TIN LƯU TRÚ */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                                    <FaBed size={18} />
                                </div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Thông tin lưu trú</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bước 01</span>
                        </div>

                        <div className="p-8">
                            {(() => {
                                const currentHotel = hotels.find(h => h.id === formData.hotelId);
                                const availableRoomTypes = currentHotel?.roomTypes || [];

                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                                        {/* Hotel Selector */}
                                        <div className="lg:col-span-2">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Chọn Khách sạn <span className="text-rose-500">*</span></label>
                                            <div className="relative group">
                                                <select
                                                    name="hotelId"
                                                    value={formData.hotelId}
                                                    onChange={handleChange}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none font-bold text-slate-700"
                                                    disabled={loadingHotels}
                                                >
                                                    <option value="">-- Danh sách khách sạn --</option>
                                                    {hotels.map(hotel => (
                                                        <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                                    <FaHotel size={14} />
                                                </div>
                                            </div>
                                            {loadingHotels && <p className="text-[10px] text-indigo-500 mt-2 font-bold animate-pulse italic">Đang tải dữ liệu khách sạn...</p>}
                                        </div>

                                        {/* Room Type */}
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Loại phòng <span className="text-rose-500">*</span></label>
                                            <select
                                                name="roomTypeCode"
                                                value={formData.roomTypeCode}
                                                onChange={handleChange}
                                                className={`w-full border rounded-2xl p-4 outline-none focus:ring-4 transition-all font-bold appearance-none ${!formData.hotelId ? 'bg-slate-50 border-slate-100 text-slate-400' : 'bg-white border-slate-200 text-indigo-600 focus:ring-indigo-500/10 focus:border-indigo-500'}`}
                                                disabled={!formData.hotelId}
                                            >
                                                <option value="">-- Loại phòng --</option>
                                                {availableRoomTypes.map(rt => (
                                                    <option key={rt.code} value={rt.code}>
                                                        {rt.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Quantity & Guests */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Số phòng</label>
                                                <input
                                                    type="number" name="quantity" min={1}
                                                    value={formData.quantity} onChange={handleChange}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Số khách</label>
                                                <input
                                                    type="number" name="numberOfGuests" min={1}
                                                    value={formData.numberOfGuests} onChange={handleChange}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                                />
                                            </div>
                                        </div>

                                        {/* Check-In */}
                                        <div className="relative group">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Ngày Check-in <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type="date" name="checkInDate"
                                                    value={formData.checkInDate} onChange={handleChange}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>

                                        {/* Check-Out */}
                                        <div className="relative group">
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Ngày Check-out <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <input
                                                    type="date" name="checkOutDate"
                                                    value={formData.checkOutDate} onChange={handleChange}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* SECTION 2: KHÁCH HÀNG & GIÁ */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                                    <FaUser size={18} />
                                </div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Khách hàng & Thanh toán</h3>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bước 02</span>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Customer Name */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Tên khách hàng <span className="text-rose-500">*</span></label>
                                    <div className="relative group">
                                        <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text" name="customerName"
                                            value={formData.customerName} onChange={handleChange}
                                            placeholder="VD: Anh Nguyễn Văn A..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold"
                                        />
                                    </div>
                                </div>

                                {/* Phone */}
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1">Số điện thoại</label>
                                    <div className="relative group">
                                        <FaPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text" name="customerPhone"
                                            value={formData.customerPhone} onChange={handleChange}
                                            placeholder="09xx..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-12 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Price Override */}
                            <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden group shadow-lg shadow-indigo-200">
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                    <div className="md:col-span-1">
                                        <h4 className="text-xl font-black mb-1 flex items-center gap-2">
                                           <span className="text-indigo-300">Giá Đặc Biệt</span> <FaMoneyBillWave className="text-amber-400" /> 
                                        </h4>
                                        <p className="text-indigo-300 text-xs font-medium">Override giá trị hệ thống nếu đặt cho người quen.</p>
                                    </div>
                                    <div className="md:col-span-2 relative group/input">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 font-black text-lg">₫</div>
                                        <input
                                            type="input" name="customPrice"
                                            value={formData.customPrice} onChange={handleChange}
                                            className="w-full bg-white/10 border border-white/20 rounded-2xl p-5 pl-12 outline-none focus:bg-white focus:text-slate-900 transition-all font-black text-2xl placeholder:text-white/20"
                                            placeholder="0"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none text-[10px] font-black text-indigo-300 bg-white/5 px-3 py-1.5 rounded-full uppercase">
                                            VND Currency
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-2 text-indigo-300/60 text-[10px] italic">
                                    <FaInfoCircle /> Nhập 0 để sử dụng giá niêm yết tự động theo thời điểm.
                                </div>
                                {/* Decorative elements */}
                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-all group-hover:scale-150"></div>
                            </div>

                            {/* Internal Note */}
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-wider mb-2 ml-1 flex items-center gap-2">
                                    <FaStickyNote className="text-slate-400" /> Ghi chú nội bộ
                                </label>
                                <textarea
                                    name="note" rows={3}
                                    value={formData.note} onChange={handleChange}
                                    placeholder="Lý do giảm giá, yêu cầu thêm của sếp..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium italic"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4 px-2">
                        <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
                            <span className="font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1 mb-1">
                                <FaCheckCircle className="text-emerald-500" /> Quy định nội bộ
                            </span>
                            Vui lòng kiểm tra kỹ ngày lưu trú tránh trùng lịch với các booking đã xác nhận trên hệ thống OTA.
                        </p>
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="flex-1 md:flex-none px-10 py-4 rounded-2xl border border-slate-200 text-slate-500 font-black text-sm hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 md:flex-none px-12 py-4 rounded-2xl bg-indigo-600 text-white font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-3"
                            >
                                {loading ? <FaSpinner className="animate-spin text-lg" /> : <FaSave className="text-lg" />}
                                TẠO ĐƠN HÀNG NGAY
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualBookingPage;