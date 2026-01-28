import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
    FaCalendarAlt, FaSearch, FaFileInvoiceDollar, FaFilter,
    FaSpinner, FaTimes, FaPhone, FaBed
} from "react-icons/fa";
import axiosClient from "@/axiosclient"; // Dùng axiosClient để gọi API filter
import { toast } from "react-toastify";
import hotelApi from "@/apis/hotelApi";

// Định nghĩa kiểu dữ liệu dựa trên JSON bạn cung cấp
interface BookingData {
    id: string;
    hotelId: string;
    customerName: string;
    customerPhone: string;
    roomTypeName: string;
    quantity: number;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    createdAt: string;
    assignedRoomNumbers: string | null;
}

const BookingByDate: React.FC = () => {
    const { id: hotelId } = useParams<{ id: string }>();

    // --- STATE DỮ LIỆU ---
    const [rawData, setRawData] = useState<BookingData[]>([]);
    const [loading, setLoading] = useState(false);

    // --- STATE BỘ LỌC (Created Date) ---
    const [dateOption, setDateOption] = useState("THIS_MONTH"); // Mặc định tháng này
    const [createdFrom, setCreatedFrom] = useState("");
    const [createdTo, setCreatedTo] = useState("");

    // --- STATE PHÂN TRANG & TÌM KIẾM ---
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // --- 1. XỬ LÝ TỰ ĐỘNG TÍNH NGÀY ---
    useEffect(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        // Hàm reset giờ về 00:00:00
        const resetTime = (d: Date) => d.setHours(0, 0, 0, 0);
        resetTime(now);

        switch (dateOption) {
            case "TODAY":
                // start, end = now
                break;
            case "TOMORROW":
                start.setDate(now.getDate() + 1);
                end.setDate(now.getDate() + 1);
                break;
            case "THIS_WEEK":
                const day = now.getDay() || 7;
                start.setDate(now.getDate() - day + 1); // Thứ 2
                end.setDate(now.getDate() - day + 7);   // Chủ nhật
                break;
            case "NEXT_WEEK":
                const nextWeek = new Date(now);
                nextWeek.setDate(now.getDate() + 7);
                const dayNext = nextWeek.getDay() || 7;
                start = new Date(nextWeek);
                start.setDate(nextWeek.getDate() - dayNext + 1);
                end = new Date(nextWeek);
                end.setDate(nextWeek.getDate() - dayNext + 7);
                break;
            case "THIS_MONTH":
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case "CUSTOM":
                return; // Không tự động set
            default:
                break;
        }

        setCreatedFrom(start.toISOString().split('T')[0]);
        setCreatedTo(end.toISOString().split('T')[0]);
    }, [dateOption]);

    // --- 2. GỌI API ---
    const fetchBookings = useCallback(async () => {
        if (!createdFrom || !createdTo) return;

        setLoading(true);
        try {
            // console.log(`📡 Fetch bookings: ${createdFrom} → ${createdTo}`);

            const res = await hotelApi.filterBookings({
                createdFrom,
                createdTo,
            });

            const list = res.data;
            const success = res.success;

            if (success && Array.isArray(list)) {
                // 🔒 Fallback: lọc client-side nếu backend trả dư dữ liệu
                const filtered = hotelId
                    ? list.filter((item: any) => item.hotelId === hotelId)
                    : list;

                setRawData(filtered);
            } else {
                setRawData([]);
                toast.info(res.message || "Không tìm thấy dữ liệu.");
            }
        } catch (error) {
            console.error("fetchBookings error:", error);
            toast.error("Lỗi kết nối server.");
        } finally {
            setLoading(false);
        }
    }, [createdFrom, createdTo]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    // --- 3. XỬ LÝ DATA (Tìm kiếm + Phân trang) ---
    const processedData = useMemo(() => {
        let data = [...rawData];

        // Lọc theo từ khóa
        if (keyword) {
            const lower = keyword.toLowerCase();
            data = data.filter(item =>
                item.customerName?.toLowerCase().includes(lower) ||
                item.customerPhone?.includes(keyword) ||
                item.id.toLowerCase().includes(lower) ||
                item.assignedRoomNumbers?.toLowerCase().includes(lower)
            );
        }

        // Sắp xếp: Mới nhất lên đầu
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return data;
    }, [rawData, keyword]);

    const totalPages = Math.ceil(processedData.length / pageSize);
    const currentTableData = processedData.slice(page * pageSize, (page + 1) * pageSize);

    // Helper format tiền
    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">

                {/* --- HEADER SECTION --- */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
                        <div>
                            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                                <span className="bg-blue-100 p-2 rounded-lg text-blue-600"><FaFileInvoiceDollar /></span>
                                Danh Sách Đơn (Theo ngày tạo)
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Lọc đơn đặt phòng dựa trên ngày tạo đơn</p>
                        </div>

                        {/* Ô tìm kiếm */}
                        <div className="relative group w-full lg:w-72">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT, mã đơn..."
                                value={keyword}
                                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                            />
                            {keyword && (
                                <button onClick={() => setKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><FaTimes /></button>
                            )}
                        </div>
                    </div>

                    {/* --- BỘ LỌC NGÀY --- */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">

                        {/* 1. Dropdown Chọn nhanh */}
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Khoảng thời gian</label>
                            <div className="relative">
                                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={dateOption}
                                    onChange={(e) => setDateOption(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none bg-white font-medium text-slate-700 cursor-pointer appearance-none"
                                >
                                    <option value="TODAY">Hôm nay</option>
                                    <option value="TOMORROW">Ngày mai</option>
                                    <option value="THIS_WEEK">Tuần này</option>
                                    <option value="NEXT_WEEK">Tuần sau</option>
                                    <option value="THIS_MONTH">Tháng này</option>
                                    <option value="CUSTOM">Tùy chỉnh...</option>
                                </select>
                            </div>
                        </div>

                        {/* 2. Từ ngày */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tạo Từ</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-200">
                                <FaCalendarAlt className="text-slate-400" />
                                <input
                                    type="date"
                                    value={createdFrom}
                                    disabled={dateOption !== 'CUSTOM'}
                                    onChange={(e) => { setCreatedFrom(e.target.value); setDateOption('CUSTOM'); }}
                                    className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 3. Đến ngày */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đến ngày</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-blue-200">
                                <FaCalendarAlt className="text-slate-400" />
                                <input
                                    type="date"
                                    value={createdTo}
                                    disabled={dateOption !== 'CUSTOM'}
                                    onChange={(e) => { setCreatedTo(e.target.value); setDateOption('CUSTOM'); }}
                                    className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 4. Nút Lọc */}
                        <div className="flex items-end">
                            <button
                                onClick={fetchBookings}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaSearch /> Xem kết quả
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-20 text-center text-slate-500">
                            <FaSpinner className="animate-spin inline-block text-4xl mb-3 text-blue-500" />
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                                        <th className="p-4">Mã đơn & Ngày tạo</th>
                                        <th className="p-4">Khách hàng</th>
                                        <th className="p-4">Phòng & Số phòng</th>
                                        <th className="p-4">Lịch trình (Check-out)</th>
                                        <th className="p-4 text-right">Tổng tiền</th>
                                        <th className="p-4 text-center">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {currentTableData.length > 0 ? (
                                        currentTableData.map((item) => (
                                            <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">

                                                {/* 1. ID & Created */}
                                                <td className="p-4">
                                                    <span className="font-mono font-bold text-blue-600 block">#{item.id.slice(-6).toUpperCase()}</span>
                                                    <span className="text-[11px] text-slate-400">Tạo: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </td>

                                                {/* 2. Customer */}
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700">{item.customerName}</div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <FaPhone size={10} /> {item.customerPhone}
                                                    </div>
                                                </td>

                                                {/* 3. Room Info */}
                                                <td className="p-4">
                                                    <p className="text-slate-700 font-medium text-sm">{item.roomTypeName}</p>
                                                    <div className="mt-1">
                                                        {item.assignedRoomNumbers ? (
                                                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">
                                                                <FaBed /> {item.assignedRoomNumbers}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Chưa gán phòng</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* 4. Schedule (Highlight Checkout) */}
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-400 mb-1">In: <span className="text-slate-600">{item.checkInDate}</span></div>
                                                    <div className="flex items-center gap-1 text-sm font-bold text-red-600">
                                                        Out: {item.checkOutDate}
                                                    </div>
                                                </td>

                                                {/* 5. Amount */}
                                                <td className="p-4 text-right font-bold text-slate-800">
                                                    {formatCurrency(item.totalAmount)}
                                                </td>

                                                {/* 6. Status */}
                                                <td className="p-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border ${item.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        item.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            item.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                                item.status === 'CHECKED_OUT' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                                                    'bg-orange-100 text-orange-600 border-orange-200'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                                Không tìm thấy đơn nào có ngày trả phòng trong khoảng này.
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
                            <span className="text-xs text-slate-500">Trang {page + 1} / {totalPages}</span>
                            <div className="flex gap-1">
                                <button
                                    disabled={page === 0}
                                    onClick={() => setPage(p => p - 1)}
                                    className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 text-xs"
                                >
                                    Trước
                                </button>
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i)}
                                        className={`px-3 py-1 border rounded text-xs ${page === i ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={page >= totalPages - 1}
                                    onClick={() => setPage(p => p + 1)}
                                    className="px-3 py-1 bg-white border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50 text-xs"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingByDate;