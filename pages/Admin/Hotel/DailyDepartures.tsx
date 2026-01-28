import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
    FaCalendarAlt, FaSearch, FaPhone, FaBed, FaDoorOpen,
    FaSignOutAlt, FaSpinner, FaFilter, FaTimes, FaMoneyBillWave, FaClock
} from "react-icons/fa";
import axiosClient from "@/axiosclient";
import hotelApi from "@/apis/hotelApi";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// --- TYPE DEFINITIONS ---
interface BookingData {
    id: string;
    hotelId: string;
    customerName: string;
    customerPhone: string;
    roomTypeName: string;
    assignedRoomNumbers: string | null;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: number;
    createdAt: string;
}

const DailyDepartures: React.FC = () => {
    const { id: hotelId } = useParams<{ id: string }>();

    // --- STATE DỮ LIỆU ---
    const [rawData, setRawData] = useState<BookingData[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // --- STATE BỘ LỌC NGÀY (CHECK-OUT) ---
    const [dateOption, setDateOption] = useState("TODAY");
    const [checkOutFrom, setCheckOutFrom] = useState("");
    const [checkOutTo, setCheckOutTo] = useState("");

    // --- STATE PHÂN TRANG & TÌM KIẾM ---
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(0);
    const pageSize = 10;

    // --- 1. XỬ LÝ NGÀY THÁNG ---
    useEffect(() => {
        const now = new Date();
        let start = new Date();
        let end = new Date();

        // Reset giờ về 00:00:00 để tính toán ngày chính xác
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
                return; // Không set tự động
            default:
                break;
        }

        setCheckOutFrom(start.toISOString().split('T')[0]);
        setCheckOutTo(end.toISOString().split('T')[0]);
    }, [dateOption]);

    // --- 2. FETCH DATA ---
const fetchDepartures = useCallback(async () => {
  if (!checkOutFrom || !checkOutTo) return;

  setLoading(true);
  try {
    console.log(`📡 Đang gọi API Departures: ${checkOutFrom} đến ${checkOutTo}`);

    const token = localStorage.getItem("accessToken");

    const response = await axiosClient.get(
      "/hotel-bookings/filter",
      {
        params: {
          checkOutFrom,
          checkOutTo,
          hotelId, // nếu backend hỗ trợ
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const resData = response.data;

    console.log("📦 Data nhận được:", resData);

    if (resData != null) {
      setRawData(resData);
    } else {
      setRawData([]);
      toast.info(resData?.message || "Không tìm thấy dữ liệu trả phòng");
    }
  } catch (error) {
    console.error("❌ Lỗi API Departures:", error);
    toast.error("Không thể tải danh sách trả phòng.");
  } finally {
    setLoading(false);
  }
}, [hotelId, checkOutFrom, checkOutTo]);



    useEffect(() => {
        fetchDepartures();
    }, [fetchDepartures]);

    // --- 3. FILTER & PAGINATION (CLIENT-SIDE) ---
    const processedData = useMemo(() => {
        let data = [...rawData];

        // Lọc từ khóa
        if (keyword) {
            const lower = keyword.toLowerCase();
            data = data.filter(item =>
                item.customerName?.toLowerCase().includes(lower) ||
                item.customerPhone?.includes(keyword) ||
                item.assignedRoomNumbers?.toLowerCase().includes(lower)
            );
        }

        // Sắp xếp: Ưu tiên CHECKED_IN lên đầu (cần xử lý gấp), sau đó đến ngày checkout gần nhất
        data.sort((a, b) => {
            if (a.status === 'CHECKED_IN' && b.status !== 'CHECKED_IN') return -1;
            if (a.status !== 'CHECKED_IN' && b.status === 'CHECKED_IN') return 1;
            return new Date(a.checkOutDate).getTime() - new Date(b.checkOutDate).getTime();
        });

        return data;
    }, [rawData, keyword]);

    const totalPages = Math.ceil(processedData.length / pageSize);
    const currentTableData = processedData.slice(page * pageSize, (page + 1) * pageSize);

    // --- 4. ACTION HANDLERS ---
    const handleCheckOut = async (bookingId: string) => {
        const result = await Swal.fire({
            title: "Xác nhận Trả phòng?",
            text: "Bạn có chắc chắn khách đã thanh toán và trả phòng?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33", // Màu đỏ cho hành động check-out
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Xác nhận Check-out",
            cancelButtonText: "Hủy"
        });

        if (!result.isConfirmed) return;

        setProcessingId(bookingId);
        try {
            await axiosClient.post(`/hotel-bookings/${bookingId}/check-out`);

            Swal.fire("Thành công!", "Khách đã trả phòng.", "success");
            fetchDepartures(); // Reload data
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi check-out");
        } finally {
            setProcessingId(null);
        }
    };

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-7xl mx-auto">

                {/* --- HEADER & FILTERS --- */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="bg-red-100 p-2 rounded-lg text-red-600"><FaSignOutAlt /></span>
                                Quản lý Trả Phòng (Check-out)
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Danh sách khách dự kiến rời đi</p>
                        </div>

                        {/* Search Box */}
                        <div className="relative group w-full lg:w-72">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên, SĐT, số phòng..."
                                value={keyword}
                                onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
                            />
                            {keyword && (
                                <button onClick={() => setKeyword("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"><FaTimes /></button>
                            )}
                        </div>
                    </div>

                    {/* Date Filters Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
                        {/* 1. Dropdown */}
                        <div className="relative">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Khoảng thời gian</label>
                            <div className="relative">
                                <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select
                                    value={dateOption}
                                    onChange={(e) => setDateOption(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none bg-white font-medium text-slate-700 cursor-pointer appearance-none"
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

                        {/* 2. From Date */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Check-out từ</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-red-200">
                                <FaCalendarAlt className="text-slate-400" />
                                <input
                                    type="date"
                                    value={checkOutFrom}
                                    disabled={dateOption !== 'CUSTOM'}
                                    onChange={(e) => { setCheckOutFrom(e.target.value); setDateOption('CUSTOM'); }}
                                    className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 3. To Date */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Đến ngày</label>
                            <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-white focus-within:ring-2 focus-within:ring-red-200">
                                <FaCalendarAlt className="text-slate-400" />
                                <input
                                    type="date"
                                    value={checkOutTo}
                                    disabled={dateOption !== 'CUSTOM'}
                                    onChange={(e) => { setCheckOutTo(e.target.value); setDateOption('CUSTOM'); }}
                                    className="w-full bg-transparent outline-none text-slate-700 disabled:text-slate-400 font-medium"
                                />
                            </div>
                        </div>

                        {/* 4. Button */}
                        <div className="flex items-end">
                            <button
                                onClick={fetchDepartures}
                                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaSearch /> Lọc danh sách
                            </button>
                        </div>
                    </div>
                </div>

                {/* --- TABLE --- */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                    {loading ? (
                        <div className="p-20 text-center text-slate-500">
                            <FaSpinner className="animate-spin inline-block text-4xl mb-3 text-red-500" />
                            <p>Đang tải dữ liệu trả phòng...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr className="text-slate-500 text-xs uppercase font-bold tracking-wider">
                                        <th className="p-4">Phòng & Loại</th>
                                        <th className="p-4">Khách hàng</th>
                                        <th className="p-4">Thời gian lưu trú</th>
                                        <th className="p-4 text-right">Tổng tiền</th>
                                        <th className="p-4 text-center">Trạng thái</th>
                                        <th className="p-4 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {currentTableData.length > 0 ? (
                                        currentTableData.map((item) => (
                                            <tr key={item.id} className="hover:bg-red-50/30 transition-colors group">

                                                {/* 1. Room Info */}
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center font-bold shadow-sm border border-orange-200">
                                                            {item.assignedRoomNumbers ? item.assignedRoomNumbers.split(',')[0] : "?"}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 line-clamp-1 w-32" title={item.roomTypeName}>{item.roomTypeName}</p>
                                                            {item.assignedRoomNumbers && item.assignedRoomNumbers.includes(',') && (
                                                                <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-500">Nhiều phòng</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 2. Customer */}
                                                <td className="p-4">
                                                    <div className="font-medium text-slate-800">{item.customerName}</div>
                                                    <div className="text-slate-500 flex items-center gap-1 mt-1 text-xs">
                                                        <FaPhone className="text-slate-400" /> {item.customerPhone}
                                                    </div>
                                                </td>

                                                {/* 3. Time */}
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-400">Vào: <span className="text-slate-600 font-medium">{item.checkInDate}</span></div>
                                                    <div className="mt-1 text-xs text-red-500 font-bold flex items-center gap-1">
                                                        Ra: {item.checkOutDate}
                                                        {/* Logic kiểm tra nếu checkOutDate < hôm nay mà chưa out thì show icon */}
                                                        {new Date(item.checkOutDate) < new Date() && item.status === 'CHECKED_IN' && <FaClock />}
                                                    </div>
                                                </td>

                                                {/* 4. Money */}
                                                <td className="p-4 text-right font-bold text-slate-700">
                                                    {formatCurrency(item.totalAmount)}
                                                </td>

                                                {/* 5. Status */}
                                                <td className="p-4 text-center">
                                                    {item.status === 'CHECKED_IN' ? (
                                                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-[11px] font-bold border border-blue-200 block w-fit mx-auto">
                                                            ĐANG Ở
                                                        </span>
                                                    ) : item.status === 'CHECKED_OUT' ? (
                                                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[11px] font-bold border border-gray-200 block w-fit mx-auto">
                                                            ĐÃ TRẢ PHÒNG
                                                        </span>
                                                    ) : item.status === 'CONFIRMED' ? (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[11px] font-bold border border-green-200 block w-fit mx-auto">
                                                            CHƯA ĐẾN
                                                        </span>
                                                    ) : (
                                                        <span className="bg-red-50 text-red-500 px-2 py-1 rounded text-[11px] font-bold border border-red-100 block w-fit mx-auto">
                                                            {item.status}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* 6. Action */}
                                                <td className="p-4 text-center">
                                                    {item.status === 'CHECKED_IN' ? (
                                                        <button
                                                            onClick={() => handleCheckOut(item.id)}
                                                            disabled={processingId === item.id}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow-sm shadow-red-200 transition-all flex items-center gap-2 mx-auto text-xs font-bold disabled:opacity-50"
                                                        >
                                                            {processingId === item.id ? <FaSpinner className="animate-spin" /> : <FaSignOutAlt />}
                                                            Check-out
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs italic">--</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="p-12 text-center text-slate-400 italic">
                                                <FaDoorOpen className="inline-block text-4xl mb-2 opacity-20" />
                                                <p>Không có dữ liệu trả phòng trong khoảng thời gian này.</p>
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
                                        className={`px-3 py-1 border rounded text-xs ${page === i ? 'bg-red-500 text-white border-red-500' : 'bg-white border-slate-300 hover:bg-slate-50'}`}
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

export default DailyDepartures;