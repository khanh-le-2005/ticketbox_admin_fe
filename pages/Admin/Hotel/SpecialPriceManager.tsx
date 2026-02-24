import React, { useEffect, useState } from 'react';
import {
    Plus, Trash2, Edit, X, Calendar,
    DollarSign, FileText, Building, AlertCircle, ChevronRight, Info,
    ChevronLeft, Save
} from 'lucide-react';
import specialPriceApi, { SpecialPrice, SpecialPricePayload } from '@/apis/specialPriceApi';
import hotelApi from '@/apis/hotelApi';
import { Hotel, RoomTypeResponse } from '@/type';

const SpecialPriceManager: React.FC = () => {
    // --- States ---
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string>('');
    const [prices, setPrices] = useState<SpecialPrice[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomTypeResponse[]>([]);

    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5; // Số lượng item trên mỗi trang

    const [loading, setLoading] = useState({ hotels: false, prices: false });
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState<string | null>(null);

    const [formData, setFormData] = useState<SpecialPricePayload>({
        hotelId: '',
        roomTypeCode: '',
        fromDate: '',
        toDate: '',
        price: 0,
        surcharge: 0,
        note: ''
    });

    // --- Effects ---

    // 1. Fetch Hotels
    useEffect(() => {
        const fetchHotels = async () => {
            setLoading(prev => ({ ...prev, hotels: true }));
            try {
                const response = await hotelApi.getAll();
                const hotelList = response?.data?.content || [];
                setHotels(hotelList);
                if (hotelList.length > 0) setSelectedHotelId(hotelList[0].id);
            } catch (error) {
                console.error("Lỗi fetch hotels:", error);
            } finally {
                setLoading(prev => ({ ...prev, hotels: false }));
            }
        };
        fetchHotels();
    }, []);

    // 2. Cập nhật RoomTypes và Prices khi chọn Hotel
    useEffect(() => {
        if (selectedHotelId) {
            const hotel = hotels.find(h => h.id === selectedHotelId);
            if (hotel && hotel.roomTypes) {
                setRoomTypes(hotel.roomTypes);
            } else {
                setRoomTypes([]);
            }

            fetchPrices(selectedHotelId);
            setFormData(prev => ({ ...prev, hotelId: selectedHotelId, roomTypeCode: '' }));
            setIsEditing(false);
            setCurrentPage(1); // Reset về trang 1 khi đổi khách sạn
        }
    }, [selectedHotelId, hotels]);

    const fetchPrices = async (hotelId: string) => {
        setLoading(prev => ({ ...prev, prices: true }));
        try {
            const response = await specialPriceApi.getByHotelId(hotelId);
            const data = (response as any)?.data?.content || (response as any)?.data || [];
            setPrices(data);
        } catch (error) {
            setPrices([]);
        } finally {
            setLoading(prev => ({ ...prev, prices: false }));
        }
    };

    // --- Logic Phân trang ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPrices = prices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(prices.length / itemsPerPage);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    // --- Actions ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && currentId) {
                await specialPriceApi.update(currentId, formData);
            } else {
                await specialPriceApi.create(formData);
            }
            resetForm();
            fetchPrices(selectedHotelId);
        } catch (error) {
            alert("Không thể lưu cấu hình giá. Vui lòng kiểm tra lại.");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thiết lập giá này?")) return;
        try {
            await specialPriceApi.delete(id);
            fetchPrices(selectedHotelId);
        } catch (error) {
            alert("Xóa thất bại.");
        }
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setFormData({
            hotelId: selectedHotelId,
            roomTypeCode: '',
            fromDate: '',
            toDate: '',
            price: 0,
            surcharge: 0,
            note: ''
        });
    };

    // Helper formatter
    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 text-slate-900 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header & Selector */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-blue-600 p-4 rounded-2xl shadow-lg shadow-blue-100 text-white">
                            <DollarSign size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-800">Quản Lý Giá Đặc Biệt</h1>
                            <p className="text-slate-500 font-medium text-sm">Thiết lập giá biến động theo thời gian</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 w-full md:w-auto hover:border-blue-300 transition-colors">
                        <Building size={20} className="text-blue-500" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Đang cấu hình cho</span>
                            <select
                                value={selectedHotelId}
                                onChange={(e) => setSelectedHotelId(e.target.value)}
                                className="bg-transparent font-bold text-slate-700 outline-none min-w-[200px] cursor-pointer"
                            >
                                {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left: Form Setup */}
                    <div className="lg:col-span-4 space-y-4">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden transition-all sticky top-4">
                            <div className={`px-6 py-5 flex items-center justify-between border-b border-slate-100 ${isEditing ? 'bg-amber-50' : 'bg-slate-50'}`}>
                                <h2 className={`font-bold flex items-center gap-2 ${isEditing ? 'text-amber-700' : 'text-slate-700'}`}>
                                    {isEditing ? <Edit size={18} /> : <Plus size={18} className="text-blue-600" />}
                                    {isEditing ? "Cập nhật giá" : "Tạo thiết lập mới"}
                                </h2>
                                {isEditing && <button onClick={resetForm} className="text-slate-400 hover:text-red-500 transition-colors"><X size={20} /></button>}
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                {/* Form fields giữ nguyên logic cũ */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Loại phòng áp dụng</label>
                                    <select
                                        required
                                        value={formData.roomTypeCode}
                                        onChange={e => setFormData({ ...formData, roomTypeCode: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-sm transition-all"
                                    >
                                        <option value="">-- Chọn loại phòng --</option>
                                        {roomTypes.map(rt => (
                                            <option key={rt.code} value={rt.code}>{rt.name}</option>
                                        ))}
                                    </select>
                                    {roomTypes.length === 0 && !loading.hotels && (
                                        <div className="mt-2 flex items-center gap-1 text-red-500 text-[11px] font-bold italic">
                                            <AlertCircle size={12} /> Cần cấu hình Loại phòng cho Hotel trước
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Từ ngày</label>
                                        <input type="date" required value={formData.fromDate} onChange={e => setFormData({ ...formData, fromDate: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-blue-500 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Đến ngày</label>
                                        <input type="date" required value={formData.toDate} onChange={e => setFormData({ ...formData, toDate: e.target.value })}
                                            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:border-blue-500 outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Giá áp dụng</label>
                                        <div className="relative">
                                            <input type="number" required value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-blue-600 outline-none focus:border-blue-500 focus:bg-white transition-all" />
                                            <span className="absolute left-3 top-3.5 text-slate-400 font-bold text-sm">₫</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Phụ thu</label>
                                        <div className="relative">
                                            <input type="number" value={formData.surcharge} onChange={e => setFormData({ ...formData, surcharge: Number(e.target.value) })}
                                                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-orange-600 outline-none focus:border-orange-500 focus:bg-white transition-all" />
                                            <span className="absolute left-3 top-3.5 text-slate-400 font-bold text-sm">₫</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Ghi chú hệ thống</label>
                                    <textarea placeholder="Ví dụ: Áp dụng cho Tết Nguyên Đán..." value={formData.note || ''} onChange={e => setFormData({ ...formData, note: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm min-h-[80px] outline-none focus:border-blue-500 resize-none" />
                                </div>

                                <button type="submit" className={`w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-2 ${isEditing ? 'bg-amber-500 shadow-amber-200 hover:bg-amber-600' : 'bg-blue-600 shadow-blue-200 hover:bg-blue-700'}`}>
                                    {isEditing ? <Save size={20} /> : <Plus size={20} />}
                                    {isEditing ? "LƯU THAY ĐỔI" : "LƯU CẤU HÌNH GIÁ"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right: Data Table */}
                    <div className="lg:col-span-8 flex flex-col h-full">
                        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-2">
                                    <FileText className="text-slate-400" size={20} />
                                    <h2 className="font-bold text-slate-800">Danh sách giá đang chạy</h2>
                                </div>
                                <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                                    Tổng: {prices.length}
                                </span>
                            </div>

                            <div className="overflow-x-auto flex-1">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Loại phòng</th>
                                            {/* Thêm min-width lớn hơn cho cột thời gian */}
                                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap min-w-[220px]">Thời gian áp dụng</th>
                                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Giá & Phụ thu</th>
                                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap w-[120px]">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {loading.prices ? (
                                            <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium italic">Đang tải dữ liệu...</td></tr>
                                        ) : prices.length === 0 ? (
                                            <tr><td colSpan={4} className="p-16 text-center text-slate-400 font-medium">
                                                <div className="flex flex-col items-center gap-2">
                                                    <AlertCircle size={32} className="text-slate-200" />
                                                    <span>Chưa có mức giá đặc biệt nào được tạo</span>
                                                </div>
                                            </td></tr>
                                        ) : (
                                            currentPrices.map((item) => {
                                                // Logic tìm tên phòng từ mã UUID
                                                const roomName = roomTypes.find(r => r.code === item.roomTypeCode)?.name || item.roomTypeCode;

                                                // Format ngày hiển thị (VD: 19/02/2026)
                                                const dateObj = new Date(item.date);
                                                const formattedDate = !isNaN(dateObj.getTime())
                                                    ? new Intl.DateTimeFormat('vi-VN').format(dateObj)
                                                    : item.date;

                                                return (
                                                    <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                                                        {/* CỘT LOẠI PHÒNG: Hiển thị tên thay vì mã UUID */}
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="font-bold text-slate-800 text-sm">{roomName}</div>
                                                            {/* Hiển thị mã code nhỏ bên dưới nếu cần debug, không thì xóa dòng dưới đi */}
                                                            <div className="text-[10px] text-slate-300 font-mono mt-0.5 truncate max-w-[100px]" title={item.roomTypeCode}>{item.roomTypeCode}</div>
                                                            <div className="text-[11px] text-slate-500 italic mt-1 line-clamp-2 bg-slate-100 px-2 py-1 rounded w-fit">
                                                                {item.note || 'Không có chú thích'}
                                                            </div>
                                                        </td>

                                                        {/* CỘT THỜI GIAN: Sửa để nhận 'date' */}
                                                        <td className="px-6 py-4 align-top">
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-2 text-slate-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 w-fit shadow-sm">
                                                                    <Calendar size={16} className="text-blue-600 shrink-0" />
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[10px] uppercase font-bold text-blue-400 leading-none mb-0.5">Ngày áp dụng</span>
                                                                        <span className="text-sm font-black text-slate-700 whitespace-nowrap">{formattedDate}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* CỘT GIÁ: Giữ nguyên */}
                                                        <td className="px-6 py-4 text-right align-top">
                                                            <div className="font-black text-blue-600 text-sm whitespace-nowrap">{formatCurrency(item.price)}</div>
                                                            {item.surcharge > 0 && (
                                                                <div className="text-[10px] font-bold text-orange-600 mt-1 bg-orange-100 px-2 py-0.5 rounded-md inline-block border border-orange-200">
                                                                    +{formatCurrency(item.surcharge)} phụ thu
                                                                </div>
                                                            )}
                                                        </td>

                                                        {/* CỘT HÀNH ĐỘNG */}
                                                        <td className="px-6 py-4 text-center align-top">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <button onClick={() => { setIsEditing(true); setFormData({ ...item, fromDate: item.date, toDate: item.date }); setCurrentId(item.id); }}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all" title="Chỉnh sửa">
                                                                    <Edit size={16} />
                                                                </button>
                                                                <button onClick={() => handleDelete(item.id)}
                                                                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-all" title="Xóa">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {prices.length > 0 && (
                                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                                    <div className="text-xs text-slate-500 font-medium">
                                        Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, prices.length)} trên tổng {prices.length}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === page
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpecialPriceManager;