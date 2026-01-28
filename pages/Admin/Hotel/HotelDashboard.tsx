// import React, { useState, useEffect, useRef } from 'react';
// import {
//     LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
//     PieChart, Pie, Cell, Legend
// } from 'recharts';
// import {
//     DollarSign, Calendar, Users, Activity,
//     LogIn, LogOut, Home, Loader2, ChevronDown, Check, Building2
// } from 'lucide-react';
// import axiosClient from '@/axiosclient';
// // import hotel from '@/api/hotel';
// // --- CONFIGURATION ---
// const TOKEN = "YOUR_BEARER_TOKEN_HERE"; // Điền Token thật vào đây

// const HotelDashboard = () => {
//     // --- STATE ---
//     const [hotels, setHotels] = useState([]);
//     const [selectedHotelId, setSelectedHotelId] = useState(null);

//     // Thời gian mặc định: Tháng 1 năm 2026
//     const [selectedMonth, setSelectedMonth] = useState(1); // 1-12
//     const [selectedYear, setSelectedYear] = useState(2026);

//     const [dashboardData, setDashboardData] = useState(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState(null);

//     // --- 1. FETCH DANH SÁCH KHÁCH SẠN ---
//     useEffect(() => {
//         const fetchHotels = async () => {
//             try {
//                 const response = await axiosClient.get(`/hotels`, {
//                     params: {
//                         page: 0,
//                         size: 100
//                     },
//                     headers: { 'Authorization': `Bearer ${TOKEN}` }
//                 });
//                 const result = response.data;
//                 // Giả sử API trả về { content: [...] } hoặc { data: [...] }
//                 const hotelList = result.content || result.data || (Array.isArray(result) ? result : []);
//                 setHotels(hotelList);
//                 if (hotelList.length > 0) 
//                     setSelectedHotelId(hotelList[0].id);


//                 // Dữ liệu giả lập danh sách khách sạn
//                 // const mockHotels = [
//                 //   { id: "H001", name: "Grand Plaza Saigon" },
//                 //   { id: "H002", name: "Ocean View Da Nang" },
//                 //   { id: "H003", name: "Hanoi Old Quarter Hotel" }
//                 // ];
//                 // setHotels(mockHotels);
//                 // setSelectedHotelId(mockHotels[0].id);

//             } catch (err) {
//                 console.error("Lỗi tải danh sách khách sạn:", err);
//             }
//         };
//         fetchHotels();
//     }, []);

//     // --- 2. FETCH DASHBOARD DATA KHI FILTER THAY ĐỔI ---
//     useEffect(() => {
//         if (!selectedHotelId) return;

//         const fetchAnalytics = async () => {
//             setLoading(true);
//             setError(null);

//             // Tính toán ngày bắt đầu và kết thúc của tháng đã chọn
//             // Tháng trong JS là 0-11, nhưng UI chọn 1-12, cần lưu ý khi dùng Date object
//             const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;

//             // Lấy ngày cuối cùng của tháng
//             const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
//             const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${lastDay}`;

//             try {
//                 console.log(`Fetching: Hotel=${selectedHotelId}, From=${startDate}, To=${endDate}`);

//                 // Bỏ comment để chạy API thật

//                 const response = await axiosClient.get(`/hotels/analytics/${selectedHotelId}/dashboard`, {
//                     params: {
//                         from: startDate,
//                         to: endDate
//                     },
//                     headers: {
//                         'Content-Type': 'application/json',
//                         'Authorization': `Bearer ${TOKEN}`
//                     }
//                 });
//                 if (!response.data) throw new Error('Không thể tải dữ liệu thống kê');
//                 setDashboardData(response.data);
//                 setLoading(false);
//             } catch (err) {
//                 setError(err.message);
//                 setLoading(false);
//             }
//         };

//         fetchAnalytics();
//     }, [selectedHotelId, selectedMonth, selectedYear]);

//     // --- HELPER: GENERATE MOCK DATA (Chỉ để demo) ---
//     const generateMockData = (year, month, daysInMonth) => ({
//         metrics: {
//             totalRevenue: Math.random() * 500000000,
//             totalBookings: Math.floor(Math.random() * 100),
//             occupancyRate: Math.floor(Math.random() * 40) + 60,
//             adr: 1500000
//         },
//         operations: { arrivalsPending: 5, departuresPending: 3, staying: 12 },
//         revenueTrend: Array.from({ length: daysInMonth }, (_, i) => ({
//             date: `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`,
//             revenue: Math.floor(Math.random() * 20000000),
//             bookings: Math.floor(Math.random() * 10)
//         })),
//         roomStatusDistribution: { AVAILABLE: 20, MAINTENANCE: 2, DIRTY: 5, OCCUPIED: 15 }
//     });

//     // Format tiền tệ
//     const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

//     // Chuẩn bị dữ liệu Pie Chart
//     const pieData = dashboardData ? [
//         { name: 'Trống', value: dashboardData.roomStatusDistribution.AVAILABLE, color: '#10B981' },
//         { name: 'Đang ở', value: dashboardData.roomStatusDistribution.OCCUPIED, color: '#3B82F6' },
//         { name: 'Bẩn', value: dashboardData.roomStatusDistribution.DIRTY, color: '#F59E0B' },
//         { name: 'Bảo trì', value: dashboardData.roomStatusDistribution.MAINTENANCE, color: '#EF4444' }
//     ].filter(item => item.value > 0) : [];

//     // Tạo danh sách năm và tháng cho Dropdown
//     const years = [2024, 2025, 2026, 2027];
//     const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }));

//     return (
//         <div className="p-6 bg-gray-50 min-h-screen font-sans text-gray-800">

//             {/* --- TOP BAR & FILTERS --- */}
//             <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//                 <div>
//                     <h1 className="text-2xl font-bold text-gray-900">Dashboard Quản Lý</h1>
//                     <p className="text-gray-500 text-sm mt-1">Xem thống kê hiệu suất kinh doanh</p>
//                 </div>

//                 {/* Filter Group */}
//                 <div className="flex flex-wrap gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100">

//                     {/* 1. Chọn Khách Sạn */}
//                     <CustomListbox
//                         icon={<Building2 className="w-4 h-4 text-gray-500" />}
//                         options={hotels.map(h => ({ value: h.id, label: h.name }))}
//                         value={selectedHotelId}
//                         onChange={setSelectedHotelId}
//                         placeholder="Chọn khách sạn"
//                         className="w-64"
//                     />

//                     {/* 2. Chọn Tháng */}
//                     <CustomListbox
//                         icon={<Calendar className="w-4 h-4 text-gray-500" />}
//                         options={months}
//                         value={selectedMonth}
//                         onChange={setSelectedMonth}
//                         className="w-36"
//                         placeholder="Chọn tháng"
//                     />

//                     {/* 3. Chọn Năm */}
//                     <CustomListbox
//                         icon={<Calendar className="w-4 h-4 text-gray-500" />}
//                         options={years.map(y => ({ value: y, label: `Năm ${y}` }))}
//                         value={selectedYear}
//                         onChange={setSelectedYear}
//                         className="w-32"
//                         placeholder="Chọn năm"
//                     />
//                 </div>
//             </div>

//             {/* --- CONTENT AREA --- */}
//             {loading ? (
//                 <div className="h-96 flex flex-col items-center justify-center">
//                     <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
//                     <p className="text-gray-500">Đang tải dữ liệu...</p>
//                 </div>
//             ) : error ? (
//                 <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center border border-red-200">
//                     Error: {error}
//                 </div>
//             ) : dashboardData ? (
//                 <>
//                     {/* KPI Cards */}
//                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
//                         <KPICard title="Tổng doanh thu" value={formatCurrency(dashboardData.metrics.totalRevenue)} icon={<DollarSign className="text-green-600" />} />
//                         <KPICard title="Tổng đặt phòng" value={dashboardData.metrics.totalBookings} icon={<Calendar className="text-blue-600" />} />
//                         <KPICard title="Công suất phòng" value={`${dashboardData.metrics.occupancyRate}%`} icon={<Activity className="text-purple-600" />} />
//                         <KPICard title="Giá TB (ADR)" value={formatCurrency(dashboardData.metrics.adr)} icon={<Users className="text-orange-600" />} />
//                     </div>

//                     {/* Main Content Grid */}
//                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//                         {/* Left Column */}
//                         <div className="space-y-6">
//                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                                 <h3 className="font-semibold text-gray-700 mb-4">Hoạt động hôm nay</h3>
//                                 <div className="space-y-4">
//                                     <OperationItem label="Sắp đến" count={dashboardData.operations.arrivalsPending} icon={<LogIn className="text-blue-500" />} />
//                                     <OperationItem label="Sắp đi" count={dashboardData.operations.departuresPending} icon={<LogOut className="text-orange-500" />} />
//                                     <OperationItem label="Đang ở" count={dashboardData.operations.staying} icon={<Home className="text-green-500" />} />
//                                 </div>
//                             </div>

//                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[300px]">
//                                 <h3 className="font-semibold text-gray-700 mb-2">Trạng thái phòng</h3>
//                                 <ResponsiveContainer width="100%" height="100%" minHeight={0}>
//                                     <PieChart>
//                                         <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
//                                             {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
//                                         </Pie>
//                                         <Tooltip />
//                                         <Legend verticalAlign="bottom" height={36} />
//                                     </PieChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>

//                         {/* Right Column: Chart */}
//                         <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
//                             <div className="flex justify-between items-center mb-6">
//                                 <h3 className="font-semibold text-gray-700">Biểu đồ doanh thu</h3>
//                                 <div className="text-sm text-gray-500">Tháng {selectedMonth}/{selectedYear}</div>
//                             </div>
//                             <div className="h-[400px]">
//                                 <ResponsiveContainer width="100%" height="100%" minHeight={0}>
//                                     <LineChart data={dashboardData.revenueTrend}>
//                                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
//                                         <XAxis dataKey="date" tickFormatter={(str) => str.split('-')[2]} stroke="#9CA3AF" fontSize={12} />
//                                         <YAxis stroke="#9CA3AF" fontSize={12} tickFormatter={(val) => val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`} />
//                                         <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ borderRadius: '8px' }} />
//                                         <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={false} name="Doanh thu" />
//                                     </LineChart>
//                                 </ResponsiveContainer>
//                             </div>
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 <div className="text-center p-10 text-gray-500">Vui lòng chọn khách sạn để xem dữ liệu.</div>
//             )}
//         </div>
//     );
// };

// // --- COMPONENT: CUSTOM LISTBOX (Dropdown) ---
// const CustomListbox = ({ options, value, onChange, placeholder, icon, className }) => {
//     const [isOpen, setIsOpen] = useState(false);
//     const dropdownRef = useRef(null);

//     // Đóng dropdown khi click ra ngoài
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
//                 setIsOpen(false);
//             }
//         };
//         document.addEventListener("mousedown", handleClickOutside);
//         return () => document.removeEventListener("mousedown", handleClickOutside);
//     }, []);

//     const selectedOption = options.find(opt => opt.value === value);

//     return (
//         <div className={`relative ${className}`} ref={dropdownRef}>
//             <button
//                 onClick={() => setIsOpen(!isOpen)}
//                 className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
//             >
//                 <div className="flex items-center gap-2 truncate">
//                     {icon}
//                     <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
//                 </div>
//                 <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//             </button>

//             {isOpen && (
//                 <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-lg max-h-60 overflow-auto py-1">
//                     {options.map((option) => (
//                         <div
//                             key={option.value}
//                             onClick={() => {
//                                 onChange(option.value);
//                                 setIsOpen(false);
//                             }}
//                             className={`flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors
//                 ${value === option.value ? 'text-blue-600 bg-blue-50 font-medium' : 'text-gray-700'}
//               `}
//                         >
//                             <span className="truncate">{option.label}</span>
//                             {value === option.value && <Check className="w-4 h-4" />}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };

// // --- COMPONENT: KPI CARD ---
// const KPICard = ({ title, value, icon }) => (
//     <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
//         <div>
//             <p className="text-gray-500 text-sm font-medium">{title}</p>
//             <h3 className="text-2xl font-bold text-gray-800 mt-2">{value}</h3>
//         </div>
//         <div className="p-3 bg-gray-50 rounded-lg h-fit">{icon}</div>
//     </div>
// );

// // --- COMPONENT: OPERATION ITEM ---
// const OperationItem = ({ label, count, icon }) => (
//     <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//         <div className="flex items-center gap-3">
//             {icon}
//             <span className="text-gray-600 text-sm font-medium">{label}</span>
//         </div>
//         <span className="font-bold text-gray-800">{count}</span>
//     </div>
// );

// export default HotelDashboard;

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend, PieChart, Pie
} from 'recharts';
import {
    DollarSign, Calendar, Hotel, TrendingUp,
    Loader2, AlertCircle, Award, LayoutDashboard
} from 'lucide-react';
import axiosClient from '@/axiosclient';
// import hotel from '@/api/hotel';

const HotelDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Cấu hình (Thay bằng Token thực tế của bạn)
    const TOKEN = "YOUR_BEARER_TOKEN";

    useEffect(() => {
        const fetchGlobalData = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get('/hotels/analytics/global-overview', {
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
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

        fetchGlobalData();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mb-4" />
                <p className="text-gray-600 font-medium">Đang tải dữ liệu toàn hệ thống...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col justify-center items-center h-screen text-red-500">
                <AlertCircle className="h-12 w-12 mb-2" />
                <p className="text-lg font-bold">Lỗi: {error}</p>
            </div>
        );
    }

    const roomStatusData = [
        { name: 'Trống', value: data.globalRoomStatus.AVAILABLE, color: '#10B981' },
        { name: 'Đang ở', value: data.globalRoomStatus.OCCUPIED, color: '#3B82F6' },
        { name: 'Bẩn', value: data.globalRoomStatus.DIRTY, color: '#F59E0B' },
        { name: 'Bảo trì', value: data.globalRoomStatus.MAINTENANCE, color: '#EF4444' },
    ].filter(item => item.value > 0);

    return (
        <div className="p-6 bg-[#f8fafc] min-h-screen font-sans">
            {/* Header */}
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                        <LayoutDashboard className="text-blue-600" />
                        Dashboard Tổng Quan khách sạn
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Báo cáo tổng hợp tình hình kinh doanh các chi nhánh</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">Trạng thái: </span>
                    <span className="text-sm text-green-600 font-bold">Dữ liệu thời gian thực</span>
                </div>
            </div>

            {/* Overview KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <KPICard
                    title="Tổng doanh thu"
                    value={formatCurrency(data.overview.totalRevenue)}
                    icon={<DollarSign className="text-green-600" />}
                    color="bg-green-50"
                />
                <KPICard
                    title="Tổng đơn đặt"
                    value={data.overview.totalBookings}
                    icon={<Calendar className="text-blue-600" />}
                    color="bg-blue-50"
                />
                <KPICard
                    title="Khách sạn hoạt động"
                    value={data.overview.activeHotels}
                    icon={<Hotel className="text-purple-600" />}
                    color="bg-purple-50"
                />
                <KPICard
                    title="ADR Toàn hệ thống"
                    value={formatCurrency(data.overview.globalAdr)}
                    icon={<TrendingUp className="text-orange-600" />}
                    color="bg-orange-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Doanh thu xu hướng */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-500" /> Xu hướng doanh thu hệ thống
                    </h3>
                    <div className="h-[350px] w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <LineChart data={data.globalTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="date" 
                                    fontSize={11} 
                                    tickFormatter={(val) => val.split('-').slice(1).reverse().join('/')}
                                />
                                <YAxis fontSize={11} tickFormatter={(val) => `${val/1000}k`} />
                                <Tooltip 
                                    formatter={(val: number) => [formatCurrency(val), "Doanh thu"]}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Phân bổ trạng thái phòng */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6">Tình trạng phòng</h3>
                    <div className="h-[300px] w-full" style={{ minWidth: 0 }}>
                        <ResponsiveContainer width="100%" height="100%" minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={roomStatusData}
                                    innerRadius={70}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {roomStatusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 text-center uppercase tracking-wider font-semibold">Tổng số phòng: {Object.values(data.globalRoomStatus).reduce((a: any, b: any) => a + b, 0)}</p>
                    </div>
                </div>

                {/* Bảng Top Khách Sạn */}
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-500" /> Bảng xếp hạng doanh thu chi nhánh
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-sm border-b border-gray-100">
                                    <th className="pb-4 font-medium">Khách sạn</th>
                                    <th className="pb-4 font-medium">Doanh thu</th>
                                    <th className="pb-4 font-medium">Đơn đặt</th>
                                    <th className="pb-4 font-medium">Hiệu suất</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.topHotels.map((hotel: any, idx: number) => (
                                    <tr key={hotel.hotelId} className="hover:bg-gray-50 transition">
                                        <td className="py-4 font-semibold text-gray-700">{hotel.hotelName}</td>
                                        <td className="py-4 text-blue-600 font-bold">{formatCurrency(hotel.revenue)}</td>
                                        <td className="py-4 text-gray-600">{hotel.bookings} đơn</td>
                                        <td className="py-4">
                                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                                <div 
                                                    className="bg-blue-500 h-full" 
                                                    style={{ width: `${Math.min((hotel.revenue / data.overview.totalRevenue) * 100 || 0, 100)}%` }}
                                                ></div>
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

// Sub-component cho thẻ KPI
const KPICard = ({ title, value, icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
        <div className={`p-3 rounded-lg ${color}`}>
            {React.cloneElement(icon, { size: 28 })}
        </div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{value}</h3>
        </div>
    </div>
);

export default HotelDashboard;