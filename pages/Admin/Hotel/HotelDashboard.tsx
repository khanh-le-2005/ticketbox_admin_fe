
import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import {
    DollarSign, Calendar, Hotel, TrendingUp,
    Loader2, AlertCircle, Award, LayoutDashboard,
    Briefcase,
    Building2,
    Users,
    ClipboardList,
    ChevronDown,
    Check,
    Activity
} from 'lucide-react';
import axiosClient from '@/axiosclient';
// import hotel from '@/api/hotel';

interface Booking {
    bookingId: string;
    hotelName: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    roomTypeName: string;
    checkInDate: string;
    checkOutDate: string;
    totalAmount: string; // From API it's a string like "700.000 ₫"
    status: string;
    pmsReservationCode: string;
}

interface HotelRevenue {
    hotelId: string;
    hotelName: string;
    revenue: string;
    bookingCount: number;
}

interface MonthlyRevenueData {
    year: number;
    month: number;
    totalPlatformRevenue: string;
    hotelRevenues: HotelRevenue[];
    bookings: Booking[];
}

const HotelDashboard = () => {
    const [data, setData] = useState<MonthlyRevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

    const years = [2024, 2025, 2026, 2027];
    const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

    useEffect(() => {
        const fetchMonthlyRevenue = async () => {
            try {
                setLoading(true);
                const response: any = await axiosClient.get(`/hotels/analytics/monthly-revenue`, {
                    params: {
                        year: selectedYear,
                        month: selectedMonth
                    }
                });

                if (response && response.success) {
                    setData(response.data);
                } else {
                    throw new Error(response.message || 'Không thể tải dữ liệu');
                }
            } catch (err: any) {
                setError(err.message || 'Đã có lỗi xảy ra khi kết nối API');
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlyRevenue();
    }, [selectedYear, selectedMonth]);

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-white">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-t-4 border-b-4 border-blue-600 animate-spin"></div>
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-l-4 border-r-4 border-blue-200 animate-pulse"></div>
                </div>
                <p className="mt-6 text-gray-500 font-medium tracking-wide animate-pulse">Đang chuẩn bị dữ liệu báo cáo...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-red-100 flex flex-col items-center max-w-md text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                    <p className="text-gray-500 mb-6">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full py-3 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-600 transition-all active:scale-95"
                    >
                        Thử lại ngay
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-[#F0F4F8] min-h-screen font-sans selection:bg-blue-100 selection:text-blue-700">
            {/* Background decorative elements */}
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-100/30 blur-[120px] -z-10 rounded-full"></div>
            <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-purple-100/30 blur-[100px] -z-10 rounded-full"></div>

            {/* Header section */}
            <div className="mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-40">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200">
                            <LayoutDashboard className="text-white w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-black text-[#1A2B3C] tracking-tight">
                            Báo Cáo <span className="text-blue-600">Doanh Thu</span>
                        </h1>
                    </div>
                    <p className="text-[#64748B] font-medium flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        Thống kê chi tiết lợi nhuận và lưu lượng đặt phòng
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-1.5 rounded-2xl border border-white/50 shadow-xl shadow-gray-200/50">
                    <CustomListbox
                        icon={<Calendar className="w-4 h-4 text-blue-500" />}
                        options={months}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        className="w-36"
                        placeholder="Chọn tháng"
                    />

                    <div className="w-[1px] h-6 bg-gray-200 mx-1"></div>

                    <CustomListbox
                        icon={<Activity className="w-4 h-4 text-blue-500" />}
                        options={years.map(y => ({ value: y, label: `Năm ${y}` }))}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        className="w-32"
                        placeholder="Chọn năm"
                    />
                </div>
            </div>

            {/* Premium KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <KPICard
                    title="Tổng doanh thu sàn"
                    value={data?.totalPlatformRevenue || "0 ₫"}
                    icon={<DollarSign />}
                    gradient="from-[#0052D4] via-[#4364F7] to-[#6FB1FC]"
                    description="Tăng 12% so với tháng trước"
                />
                <KPICard
                    title="Hệ thống khách sạn"
                    value={`${data?.hotelRevenues.length || 0} Đối tác`}
                    icon={<Hotel />}
                    gradient="from-[#FF416C] to-[#FF4B2B]"
                    description="Hiện đang hoạt động ổn định"
                />
                <KPICard
                    title="Tổng đơn tháng này"
                    value={`${data?.bookings.length || 0} Booking`}
                    icon={<ClipboardList />}
                    gradient="from-[#1D976C] to-[#93F9B9]"
                    description="Tỉ lệ hủy đơn: 2.4%"
                />
            </div>

            <div className="grid grid-cols-1 gap-10">
                {/* Modernized Revenue Table */}
                <div className="bg-white rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-gray-100 overflow-hidden group">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-transparent">
                        <div>
                            <h3 className="text-xl font-bold text-[#1A2B3C] flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 transition-transform">
                                    <Building2 className="h-5 w-5" />
                                </div>
                                Hiệu suất doanh thu từng chi nhánh
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">Bản phân tích lợi nhuận dựa trên tổng số booking</p>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-[11px] uppercase tracking-[0.1em] font-bold border-b border-gray-50">
                                    <th className="px-8 py-5">Tên khách sạn</th>
                                    <th className="px-6 py-5">Doanh thu thu về</th>
                                    <th className="px-6 py-5 text-center">Lượng đơn</th>
                                    <th className="px-8 py-5 text-right w-[200px]">Phân bổ hệ thống</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data?.hotelRevenues.map((hotel, idx) => (
                                    <tr key={hotel.hotelId} className="hover:bg-blue-50/30 transition-all duration-300 group/row">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-100">
                                                    {hotel.hotelName.substring(0, 1)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#1A2B3C] group-hover/row:text-blue-600 transition-colors">{hotel.hotelName}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono tracking-tighter">ID: {hotel.hotelId}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="inline-flex items-center bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl font-black text-sm border border-emerald-100">
                                                {hotel.revenue}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-lg text-sm">{hotel.bookingCount}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between text-[10px] font-bold text-gray-500 italic">
                                                    <span>Tiềm năng</span>
                                                    <span>{90 - idx * 5}%</span>
                                                </div>
                                                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden shadow-inner">
                                                    <div 
                                                        className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full" 
                                                        style={{ width: `${90 - idx * 5}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {(!data || data.hotelRevenues.length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="py-20 text-center text-gray-300">
                                            Không có dữ liệu
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Glassy Booking List */}
                <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-gray-200/50 border border-white overflow-hidden group">
                    <div className="p-8 border-b border-gray-100/50 flex justify-between items-center">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                                <ClipboardList className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-[#1A2B3C]">Nhật ký giao dịch hệ thống</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Thời gian thực</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-black text-blue-600">{data?.bookings.length || 0} <span className="text-gray-400 font-medium">Khách hàng</span></span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-[11px] uppercase tracking-wider font-bold border-b border-gray-50/50">
                                    <th className="px-8 py-6">Mã Giao Dịch</th>
                                    <th className="px-6 py-6">Khách hàng</th>
                                    <th className="px-6 py-6 text-center">Thời gian lưu trú</th>
                                    <th className="px-6 py-6">Thông tin phòng</th>
                                    <th className="px-8 py-6 text-right">Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50/50">
                                {data?.bookings.map((booking) => (
                                    <tr key={booking.bookingId} className="hover:bg-white/50 transition-all duration-300 group/row">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] w-fit font-mono">{booking.bookingId.substring(0, 10)}</span>
                                                <span className="font-black text-[#1A2B3C] text-sm italic group-hover/row:text-blue-600 transition-colors">#{booking.pmsReservationCode}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {booking.customerName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-[#1A2B3C] text-sm">{booking.customerName}</span>
                                                    <span className="text-[10px] text-gray-400">{booking.customerPhone}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="inline-flex flex-col items-center bg-gray-50/80 px-4 py-2 rounded-2xl border border-gray-100">
                                                <div className="flex items-center gap-2 text-[11px] font-black text-[#1A2B3C]">
                                                    <span>{booking.checkInDate}</span>
                                                    <TrendingUp className="w-3 h-3 text-emerald-500 rotate-90" />
                                                    <span>{booking.checkOutDate}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-[#1A2B3C]">{booking.hotelName}</span>
                                                <span className="text-[11px] text-blue-500 font-medium bg-blue-50 w-fit px-2 py-0.5 rounded-lg border border-blue-100">{booking.roomTypeName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-md font-black text-emerald-600">{booking.totalAmount}</span>
                                                <div className={`text-[10px] font-black px-2.5 py-1 rounded-full border shadow-sm ${
                                                    booking.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                    booking.status === 'CANCELLED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                                                }`}>
                                                    {booking.status}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Premium KPI Card
const KPICard = ({ title, value, icon, gradient, description }: any) => (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl cursor-default`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        
        <div className="relative z-10 flex justify-between items-start mb-10">
            <div className="p-4 bg-white/20 backdrop-blur-lg rounded-2xl border border-white/20 shadow-xl">
                {React.cloneElement(icon, { size: 32, className: "text-white" })}
            </div>
        </div>
        
        <div className="relative z-10">
            <p className="text-white/80 text-sm font-bold uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-4xl font-black text-white drop-shadow-md mb-4">{value}</h3>
            <div className="flex items-center gap-2 bg-black/10 backdrop-blur-sm w-fit px-3 py-1.5 rounded-xl border border-white/5">
                <TrendingUp className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white/90 italic">{description}</span>
            </div>
        </div>
    </div>
);

const CustomListbox = ({ options, value, onChange, placeholder, icon, className }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedOption = options.find((opt: any) => opt.value === value);

    return (
        <div className={`relative ${className} ${isOpen ? 'z-50' : 'z-0'}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-white/80 hover:bg-white border border-gray-100 text-[#1A2B3C] py-2.5 px-4 rounded-2xl text-sm font-bold shadow-sm backdrop-blur-md transition-all active:scale-95"
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-3 w-full bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                    {options.map((option: any) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex items-center justify-between px-5 py-3 text-sm cursor-pointer transition-colors
                                ${value === option.value ? 'bg-blue-600 text-white font-black' : 'text-[#64748B] hover:bg-blue-50 hover:text-blue-600'}
                            `}
                        >
                            <span className="truncate">{option.label}</span>
                            {value === option.value && <Check className="w-4 h-4" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default HotelDashboard;