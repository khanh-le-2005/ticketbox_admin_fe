import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3, Users, ClipboardList, Store, TrendingUp, LayoutGrid, Calendar as CalendarIcon, Loader2
} from 'lucide-react';
import axiosClient from '@/axiosclient';

// --- TYPES DEFINITION ---

// 1. Type cho API Bảng phòng trống
// interface RoomTypeRow {
//   roomTypeCode: string;
//   roomTypeName: string;
//   totalRooms: number;
//   availableCounts: number[];
// }

interface RoomStats {
  totalRooms: number;
  maintenanceRooms: number;
  occupiedRooms: number;
  availableRooms: number;
}

interface HotelStats {
  hotelId: string;
  hotelName: string;
  dates: string[];
  rows: RoomTypeRow[];
  totalAvailableByDate: number[];
}

// 2. Type cho API Hoạt động trong ngày
interface DailyActivity {
  arrived: number;
  departed: number;
  expectedArrival: number;
  expectedDeparture: number;
  dayUse: number;
}

// 3. Type cho API Thống kê khách (MỚI THÊM)
interface GuestCount {
  rooms: number;
  adults: number;
  children: number;
}

interface GuestStatsData {
  currentInHouse: GuestCount;     // Khách đang ở
  expectedArrival: GuestCount;    // Dự kiến đến
  expectedDeparture: GuestCount;  // Dự kiến đi
  stayOver: GuestCount;           // Ở qua ngày
  dayUse: GuestCount;             // Trong ngày
  totalForecast: GuestCount;      // Tổng dự kiến
}

interface DailyActivityDetail {
  arrived: number;
  expectedArrival: number;
  departed: number;
  expectedDeparture: number;
  dayUse: number;
}
// Interface cho API Trạng thái buồng phòng
interface HousekeepingStats {
  occupiedDirty: number;
  vacantDirty: number;
  expectedCheckout: number;
}

// Thêm vào trong Component DashboardStats:

// --- UI COMPONENTS ---
const CardHeader = ({ icon: Icon, title, rightContent }: { icon: any, title: string, rightContent?: React.ReactNode }) => (
  <div className="bg-[#435ebe] text-white p-3 rounded-t-lg flex items-center justify-between">
    <div className="flex items-center gap-2">
      <Icon size={18} />
      <span className="font-medium text-sm uppercase">{title}</span>
    </div>
    {rightContent}
  </div>
);

const StatRow = ({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) => (
  <div className={`flex justify-between items-center p-3 border-b border-gray-100 text-sm ${highlight ? 'font-bold bg-gray-50' : 'text-gray-700'}`}>
    <span>{label}</span>
    <span className="font-semibold text-gray-900">{value}</span>
  </div>
);

// --- MAIN COMPONENT ---
export default function DashboardStats() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // --- STATES ---
  const [availabilityData, setAvailabilityData] = useState<HotelStats[]>([]); // API 1
  const [dailyActivity, setDailyActivity] = useState<DailyActivity | null>(null); // API 2
  const [guestStats, setGuestStats] = useState<GuestStatsData | null>(null); // API 3 (MỚI)
  const [dailyActivityDetail, setDailyActivityDetail] = useState<DailyActivity | null>(null);
  const [housekeeping, setHousekeeping] = useState<HousekeepingStats | null>(null);
  const [roomStats, setRoomStats] = useState<RoomStats | null>(null);

  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('2026-01-31'); // Set mặc định theo data mẫu của bạn

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    try {
      // Tính ngày kết thúc cho bảng (+5 ngày)
      const start = new Date(fromDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      const toDate = end.toISOString().split('T')[0];

      // GỌI SONG SONG 3 API
      const [availabilityRes, activityRes, guestRes, dailyDetailRes, housekeepingRes, roomStatsRes] = await Promise.all([
        // 1. API Bảng phòng trống
        axiosClient.get('/hotels/analytics/stats/availability-all', {
          params: { from: fromDate, to: toDate }
        }),

        // 2. API Thống kê hôm nay
        axiosClient.get('/hotels/analytics/global-daily-activities', {
          params: { date: fromDate }
        }),

        // 3. API Thống kê khách (MỚI)
        axiosClient.get('/hotels/analytics/guest-stats', {
          params: { date: fromDate }
        }),

        // 4. API Thống kê phòng
        axiosClient.get('/hotels/analytics/daily-activity', {
          params: { date: fromDate }
        }),

        // 5. API Trạng thái buồng phòng
        axiosClient.get('/hotels/analytics/housekeeping-stats', {
          params: { date: fromDate }
        }),
        axiosClient.get('/hotels/analytics/room-stats', {
          params: { date: fromDate }
        })
      ]);

      // --- XỬ LÝ DATA 1: Bảng ---
      const availData = availabilityRes.data ? availabilityRes.data : availabilityRes;
      if (Array.isArray(availData)) {
        setAvailabilityData(availData);
      } else if (availData && Array.isArray(availData.data)) {
        setAvailabilityData(availData.data);
      } else {
        setAvailabilityData([]);
      }

      // --- XỬ LÝ DATA 2: Hoạt động ---
      const actData = dailyActivityResHelper(activityRes);
      if (actData) setDailyActivity(actData);

      // --- XỬ LÝ DATA 3: Khách (MỚI) ---
      const gData = guestResHelper(guestRes);
      if (gData) setGuestStats(gData);

      // --- XỬ LÝ DATA 4: Hoạt động trong ngày ---
      const dctData = dailyDetailRes.data || dailyDetailRes.data;
      if (dctData) {
        setDailyActivityDetail({
          arrived: dctData.arrived ?? 0,
          expectedArrival: dctData.expectedArrival ?? 0,
          departed: dctData.departed ?? 0,
          expectedDeparture: dctData.expectedDeparture ?? 0,
          dayUse: dctData.dayUse ?? 0
        });
      }
      // --- XỬ LÝ DATA 5: Trạng thái buồng phòng (MỚI) ---
      const hkData = housekeepingRes.data?.data || housekeepingRes.data;
      if (hkData) {
        setHousekeeping({
          occupiedDirty: hkData.occupiedDirty ?? 0,
          vacantDirty: hkData.vacantDirty ?? 0,
          expectedCheckout: hkData.expectedCheckout ?? 0
        });
      }

      // --- XỬ LÝ DATA 6: Phòng (MỚI) ---
      const roomData = roomStatsRes.data?.data || roomStatsRes.data;
      if (roomData) {
        setRoomStats({
          totalRooms: roomData.totalRooms ?? 0,
          maintenanceRooms: roomData.maintenanceRooms ?? 0,
          occupiedRooms: roomData.occupiedRooms ?? 0,
          availableRooms: roomData.availableRooms ?? 0
        });
      }

    } catch (error) {
      console.error("Lỗi tải dữ liệu Dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper xử lý response axios (để code gọn hơn)
  const dailyActivityResHelper = (res: any) => {
    const body = res.data ? res.data : res;
    return body?.data || null;
  };

  const guestResHelper = (res: any) => {
    const body = res.data ? res.data : res;
    return body?.data || null;
  };

  useEffect(() => {
    fetchData();
  }, [fromDate]);

  // --- LOGIC HELPER ---

  // Tính tổng bảng
  const dateHeaders = availabilityData.length > 0 ? availabilityData[0].dates : [];
  const calculateGrandTotals = () => {
    if (availabilityData.length === 0) return [];
    const totals = new Array(dateHeaders.length).fill(0);
    availabilityData.forEach(hotel => {
      hotel.rows.forEach(row => {
        row.availableCounts.forEach((count, index) => {
          totals[index] += count;
        });
      });
    });
    return totals;
  };
  const grandTotals = calculateGrandTotals();

  // Format ngày
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  };

  // Format hiển thị khách: Phòng / Lớn / Nhỏ
  const fmtGuest = (stat?: GuestCount) => {
    if (!stat) return "0 / 0 / 0";
    return `${stat.rooms} / ${stat.adults} / ${stat.children}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">

      {/* MENU */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 text-sm font-medium">
        <Link to="/doanh-thu" className={`pb-2 transition-colors border-b-2 ${isActive('/doanh-thu') ? 'border-cyan-400 text-cyan-500' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Doanh thu</Link>
        <Link to="/thong-ke" className={`pb-2 transition-colors border-b-2 ${isActive('/thong-ke') ? 'border-cyan-400 text-cyan-500' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Thống kê</Link>
        <Link to="/bieu-do" className={`pb-2 transition-colors border-b-2 ${isActive('/bieu-do') ? 'border-cyan-400 text-cyan-500' : 'border-transparent text-gray-500 hover:text-blue-600'}`}>Biểu đồ thống kê</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* CARD 1: THỐNG KÊ HÔM NAY 
            (Tôi tận dụng API guest-stats để lấy số lượng phòng cho card này luôn) 
        */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <CardHeader icon={BarChart3} title="Thống kê hôm nay" />
          <div className="flex-1">
            <StatRow label="Phòng có khách" value={guestStats?.currentInHouse?.rooms ?? 0} />
            <StatRow label="Phòng dự kiến đi" value={guestStats?.expectedDeparture?.rooms ?? 0} />
            <StatRow label="Phòng ở qua ngày" value={guestStats?.stayOver?.rooms ?? 0} />
            <StatRow label="Phòng dự kiến đến" value={guestStats?.expectedArrival?.rooms ?? 0} />

            {/* Tổng số phòng sẵn sàng lấy từ bảng availability (cột ngày đầu tiên) */}
            <StatRow label="Tổng số phòng sẵn sàng" value={grandTotals.length > 0 ? grandTotals[0] : 0} />

            <StatRow label="Dự kiến phòng chiếm dụng" value={guestStats?.totalForecast?.rooms ?? 0} />
            <StatRow label="Công suất dự kiến" value="-" />
          </div>
        </div>

        {/* CARD 2: TỔNG SỐ KHÁCH (DÙNG API MỚI guest-stats) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <CardHeader
            icon={Users}
            title="Tổng số khách ( Phòng / Lớn / Nhỏ )"
          />
          <div className="flex-1">
            <StatRow label="Khách đang ở" value={fmtGuest(guestStats?.currentInHouse)} />
            <StatRow label="Khách dự kiến đi" value={fmtGuest(guestStats?.expectedDeparture)} />
            <StatRow label="Khách ở qua ngày" value={fmtGuest(guestStats?.stayOver)} />
            <StatRow label="Dự kiến đến" value={fmtGuest(guestStats?.expectedArrival)} />
            <StatRow label="Tổng khách dự kiến" value={fmtGuest(guestStats?.totalForecast)} highlight />
          </div>
        </div>

        {/* CARD 3: HOẠT ĐỘNG TRONG NGÀY (DÙNG API global-daily-activities) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col">
          <CardHeader icon={ClipboardList} title="Hoạt động trong ngày" />
          <div className="flex-1">
            <StatRow label="Đã đến" value={dailyActivityDetail?.arrived ?? 0} />
            <StatRow label="Dự kiến đến" value={dailyActivityDetail?.expectedArrival ?? 0} />
            <StatRow label="Đã đi" value={dailyActivityDetail?.departed ?? 0} />
            <StatRow label="Dự kiến đi" value={dailyActivityDetail?.expectedDeparture ?? 0} />
            <StatRow label="Đến & đi trong ngày" value={dailyActivityDetail?.dayUse ?? 0} />
          </div>
        </div>
      </div>

      {/* CARD 4: THỐNG KÊ PHÒNG */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-fit">
        <CardHeader icon={Store} title="Thống kê phòng" />
        <div className="flex-1">
          <StatRow label="Tổng số phòng" value={roomStats?.totalRooms ?? 0} />
          <StatRow label="Phòng đang sửa (Maintenance)" value={roomStats?.maintenanceRooms ?? 0} />
          <StatRow label="Phòng có khách (Occupied)" value={roomStats?.occupiedRooms ?? 0} />
          <StatRow label="Phòng sẵn sàng (Available)" value={roomStats?.availableRooms ?? 33} highlight />
        </div>
      </div>


      {/* CARD 5: BẢNG DỮ LIỆU (DÙNG API availability-all) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col md:col-span-2 lg:col-span-1 xl:col-span-1">
        <CardHeader
          icon={TrendingUp}
          title="Thống kê phòng trống"
          rightContent={
            <div className="flex items-center bg-white rounded overflow-hidden h-6 border border-gray-300">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-xs text-gray-700 px-2 outline-none border-none h-full bg-transparent"
              />
              <div className="bg-gray-100 px-1 h-full flex items-center justify-center border-l border-gray-300">
                <CalendarIcon size={12} className="text-gray-500" />
              </div>
            </div>
          }
        />
        <div className="flex-1 overflow-x-auto p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="animate-spin mr-2" size={20} /> Đang tải...
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 border border-gray-200 font-semibold text-gray-600 min-w-[100px]">Loại phòng</th>
                  {dateHeaders.map((date, idx) => (
                    <th key={idx} className="p-2 border border-gray-200 font-semibold text-gray-600 text-center min-w-[40px]">
                      {formatDate(date)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {availabilityData.length > 0 ? (
                  availabilityData.map((hotel) => (
                    hotel.rows.map((row, rIdx) => (
                      <tr key={`${hotel.hotelId}-${rIdx}`} className="hover:bg-blue-50 transition-colors">
                        <td className="p-2 border border-gray-200 text-gray-700 font-medium whitespace-nowrap">
                          {row.roomTypeName}
                        </td>
                        {row.availableCounts.map((count, cIdx) => (
                          <td key={cIdx} className="p-2 border border-gray-200 text-center text-gray-700">
                            {count}
                          </td>
                        ))}
                      </tr>
                    ))
                  ))
                ) : (
                  <tr><td colSpan={7} className="p-4 text-center text-gray-500">Không có dữ liệu</td></tr>
                )}
                <tr className="bg-white">
                  <td className="p-2 border border-gray-200 text-gray-800 font-bold">Tổng</td>
                  {grandTotals.map((total, idx) => (
                    <td key={idx} className="p-2 border border-gray-200 text-center text-gray-800 font-bold">{total}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CARD 6: TRẠNG THÁI BUỒNG PHÒNG */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-fit">
        <CardHeader icon={LayoutGrid} title="Trạng thái buồng phòng" />
        <div className="flex-1">
          <StatRow label="Bẩn do khách ở (Occupied Dirty)" value={housekeeping?.occupiedDirty ?? 0} />
          <StatRow label="Phòng trống bẩn (Vacant Dirty)" value={housekeeping?.vacantDirty ?? 0} />
          <StatRow label="Dự kiến trả phòng (Expected Checkout)" value={housekeeping?.expectedCheckout ?? 0} />
        </div>
      </div>

    </div>
  );
}