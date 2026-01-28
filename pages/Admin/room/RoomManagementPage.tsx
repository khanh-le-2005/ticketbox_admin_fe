import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import hotelApi from "@/apis/hotelApi";
import roomApi from "@/apis/roomApi";
import { Hotel } from "@/type";
import axiosClient from "@/axiosclient";
import { toast } from "react-toastify";
import {
  FaEdit,
  FaTrash,
  FaSearch,
  FaBed,
  FaUserCheck,
  FaBroom,
  FaTools,
  FaHotel,
  FaDoorOpen,
  FaCalendarAlt,
  FaFilter,
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaCheck
} from "react-icons/fa";
import { RoomInstance, DashboardData } from "@/type/room.types";
import Swal from "sweetalert2";
import { Listbox } from "@headlessui/react";
const ITEMS_PER_PAGE = 10; // Số lượng phòng hiển thị trên 1 trang

const RoomManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");

  const [roomInstances, setRoomInstances] = useState<RoomInstance[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(false);

  // --- COMPUTED VALUES ---
  const selectedHotel = hotels.find(hotel => hotel.id === selectedHotelId);

  // --- STATE PHÂN TRANG ---
  const [currentPage, setCurrentPage] = useState(1);

  // --- 1. FETCH DANH SÁCH KHÁCH SẠN ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res: any = await hotelApi.getAll();
        let hotelList = [];
        if (res?.data?.content) hotelList = res.data.content;
        else if (res?.data?.data?.content) hotelList = res.data.data.content;
        else if (res?.data?.data) hotelList = res.data.data;
        else if (res?.data) hotelList = res.data;

        if (Array.isArray(hotelList) && hotelList.length > 0) {
          setHotels(hotelList);
          const urlHotelId = searchParams.get("hotelId");
          if (urlHotelId) {
            setSelectedHotelId(urlHotelId);
          } else {
            setSelectedHotelId(hotelList[0].id);
          }
        }
      } catch (error) {
        console.error("Lỗi tải danh sách khách sạn:", error);
        toast.error("Không thể tải danh sách khách sạn.");
      }
    };
    fetchHotels();
  }, []);

  // --- 2. FETCH DATA (ROOMS + DASHBOARD) ---
  useEffect(() => {
    if (!selectedHotelId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setSearchParams({ hotelId: selectedHotelId });

        // Gọi song song 2 API
        const [dashboardRes, roomsRes]: [any, any] = await Promise.all([
          axiosClient.get(`/hotels/${selectedHotelId}/dashboard`),
          axiosClient.get(`/hotels/${selectedHotelId}/rooms`),
        ]);

        // A. Xử lý Dashboard
        const dashData = dashboardRes.data?.data || dashboardRes.data;
        if (dashData) setDashboardStats(dashData);

        // B. Xử lý Danh sách phòng
        const roomsData = roomsRes.data?.data || roomsRes.data || [];
        if (Array.isArray(roomsData)) {
          roomsData.sort((a: RoomInstance, b: RoomInstance) =>
            a.roomNumber.localeCompare(b.roomNumber)
          );
          setRoomInstances(roomsData);
          setCurrentPage(1); // Reset về trang 1 khi đổi khách sạn
        } else {
          setRoomInstances([]);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        toast.error("Lỗi khi tải dữ liệu phòng.");
        setRoomInstances([]);
        setDashboardStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedHotelId, hotels, setSearchParams]);

  // --- LOGIC PHÂN TRANG ---
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentRooms = roomInstances.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(roomInstances.length / ITEMS_PER_PAGE);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // --- UI HANDLERS ---
  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedHotelId(e.target.value);

  const handleDeleteRoom = async (roomId: string) => {
    const result = await Swal.fire({
      title: "Xóa phòng?",
      text: "Bạn có chắc chắn muốn xóa phòng này không? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    console.log("Delete room", roomId);
    toast.success("Đã xóa phòng thành công!");

    // TODO: gọi API delete phòng
    // await roomApi.delete(roomId);
    // setRoomInstances(prev => prev.filter(r => r.id !== roomId));
  };

  const handleCleanRoom = async (roomId: string) => {
    if (!selectedHotelId) return;

    try {
      await roomApi.markRoomAsClean(selectedHotelId, roomId);
      toast.success("Đã dọn phòng xong!");

      // Cập nhật local state thay vì refetch toàn bộ để tối ưu
      setRoomInstances(prev => prev.map(r =>
        r.id === roomId ? { ...r, status: "AVAILABLE" } : r
      ));

      // Cập nhật dashboard stats nếu có
      if (dashboardStats) {
        setDashboardStats({
          ...dashboardStats,
          dirty: { ...dashboardStats.dirty, count: Math.max(0, dashboardStats.dirty.count - 1) },
          available: { ...dashboardStats.available, count: dashboardStats.available.count + 1 }
        });
      }
    } catch (error: any) {
      console.error("Lỗi dọn phòng:", error);
      toast.error(error.response?.data?.message || "Không thể dọn phòng.");
    }
  };

  // Helper Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">Sẵn sàng</span>;
      case "OCCUPIED":
        return <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200"><FaUserCheck size={10} /> Đang ở</span>;
      case "DIRTY":
        return <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200"><FaBroom size={10} /> Chưa dọn</span>;
      case "MAINTENANCE":
        return <span className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200"><FaTools size={10} /> Bảo trì</span>;
      default:
        return <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-3">
              <span className="bg-orange-100 p-2 rounded-xl text-orange-600"><FaDoorOpen size={24} /></span>
              Quản Lý Phòng
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium ml-14">Theo dõi trạng thái và quản lý danh sách phòng.</p>
          </div>

          <Listbox
            value={selectedHotel || null}
            onChange={(hotel) => setSelectedHotelId(hotel.id)}
          >
            <div className="relative">
              {/* Button */}
              <Listbox.Button
                className="
        group relative flex items-center gap-3
        bg-white p-2 pr-4
        rounded-xl
        border border-slate-200
        shadow-sm
        hover:border-orange-300
        focus:outline-none focus:ring-2 focus:ring-orange-200
        transition-all
        cursor-pointer
        min-w-[280px]
      "
              >
                <div className="bg-orange-50 p-2.5 rounded-lg text-orange-500 group-hover:bg-orange-100 transition-colors">
                  <FaHotel size={16} />
                </div>

                <div className="flex-1 text-left relative">
                  <label className="text-[10px] uppercase font-bold text-slate-400 absolute -top-6 left-0">
                    Chọn khách sạn
                  </label>

                  <span className="block text-slate-700 font-bold text-sm truncate">
                    {selectedHotel?.name || "Chọn khách sạn"}
                  </span>
                </div>

                <span className="text-slate-400 group-hover:text-orange-500 transition-colors">
                  <FaChevronDown size={12} />
                </span>
              </Listbox.Button>

              {/* Options */}
              <Listbox.Options
                className="
        absolute z-50 mt-2 w-full
        rounded-xl bg-white
        shadow-lg border border-slate-200
        max-h-60 overflow-auto
        focus:outline-none
      "
              >
                {hotels.map((hotel) => (
                  <Listbox.Option
                    key={hotel.id}
                    value={hotel}
                    className={({ active }) =>
                      `
            cursor-pointer select-none px-4 py-2.5
            flex items-center justify-between
            ${active ? "bg-orange-50 text-orange-600" : "text-slate-700"}
          `
                    }
                  >
                    {({ selected }) => (
                      <>
                        <span className={`text-sm ${selected ? "font-bold" : "font-medium"}`}>
                          {hotel.name}
                        </span>
                        {selected && <span className="text-orange-500"><FaCheck size={12} /></span>}
                      </>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </div>
          </Listbox>

        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center h-96 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-orange-500 mb-4"></div>
            <span className="text-slate-500 font-bold text-lg">Đang tải dữ liệu...</span>
          </div>
        ) : (
          <>
            {/* DASHBOARD STATS */}
            {dashboardStats && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl group-hover:bg-green-100 transition-colors"><FaBed size={20} /></div>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">Sẵn sàng</span>
                  </div>
                  <div><h3 className="text-3xl font-extrabold text-slate-800 mb-1">{dashboardStats.available.count}</h3><p className="text-slate-500 text-sm font-medium">Phòng trống</p></div>
                </div>
                {/* Các thẻ thống kê khác giữ nguyên logic tương tự */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors"><FaUserCheck size={20} /></div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-lg">Đang ở</span>
                  </div>
                  <div><h3 className="text-3xl font-extrabold text-slate-800 mb-1">{dashboardStats.occupied.count}</h3><p className="text-slate-500 text-sm font-medium">Khách đang thuê</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl group-hover:bg-yellow-100 transition-colors"><FaBroom size={20} /></div>
                    <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-1 rounded-lg">Chưa dọn</span>
                  </div>
                  <div><h3 className="text-3xl font-extrabold text-slate-800 mb-1">{dashboardStats.dirty.count}</h3><p className="text-slate-500 text-sm font-medium">Cần dọn dẹp</p></div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-100 transition-colors"><FaTools size={20} /></div>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-lg">Bảo trì</span>
                  </div>
                  <div><h3 className="text-3xl font-extrabold text-slate-800 mb-1">{dashboardStats.maintenance.count}</h3><p className="text-slate-500 text-sm font-medium">Đang sửa chữa</p></div>
                </div>
              </div>
            )}

            {/* ROOM LIST (TABLE VIEW) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* List Header */}
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm text-slate-500"><FaFilter size={14} /></div>
                  <h3 className="font-bold text-slate-700 text-lg">Danh sách phòng</h3>
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full border border-orange-200">{roomInstances.length}</span>
                </div>
              </div>

              {/* Table Content */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-slate-600">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-bold">Số phòng</th>
                      <th className="px-6 py-4 font-bold">Loại phòng</th>
                      <th className="px-6 py-4 font-bold text-center">Trạng thái</th>
                      <th className="px-6 py-4 font-bold text-right">Ngày tạo</th>
                      <th className="px-6 py-4 font-bold text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentRooms.length > 0 ? (
                      currentRooms.map((room) => (
                        <tr key={room.id} className="bg-white hover:bg-slate-50 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="text-base font-bold text-slate-800 block whitespace-nowrap">
                                {/* Logic: Tách chuỗi theo dấu "-" và lấy phần số cuối cùng, sau đó ghép với "P-" */}
                                {(() => {
                                  // Nếu tên phòng có dấu "-" (VD: THẢ-01)
                                  if (room.roomNumber.includes('-')) {
                                    const parts = room.roomNumber.split('-');
                                    const numberPart = parts[parts.length - 1]; // Lấy phần số (01)
                                    return `P-${numberPart}`;
                                  }
                                  // Trường hợp phòng không có dấu gạch (VD: 101), thì thêm P- đằng trước
                                  return `P-${room.roomNumber}`;
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-700">{room.roomTypeName}</span>
                          </td>
                          <td className="px-6 py-4 text-center">{getStatusBadge(room.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 text-slate-500 text-xs font-medium">
                              <span className="text-slate-400"><FaCalendarAlt size={12} /></span>
                              {new Date(room.createdAt).toLocaleDateString("vi-VN")}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 text-slate-800">
                              {room.status === "DIRTY" && (
                                <button
                                  onClick={() => handleCleanRoom(room.id)}
                                  className="p-2 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-all"
                                  title="Đã dọn xong"
                                >
                                  <FaBroom size={16} />
                                </button>
                              )}
                              {/* <button onClick={() => navigate(`/rooms/edit/${room.id}`)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Chỉnh sửa"><FaEdit size={16} /></button> */}
                              <button onClick={() => handleDeleteRoom(room.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Xóa"><FaTrash size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><span className="text-slate-300"><FaSearch size={24} /></span></div>
                            <p className="font-medium text-slate-600 mb-1">Chưa có phòng nào</p>
                            <p className="text-slate-400 text-sm mb-4">Khách sạn này chưa có phòng vật lý nào được tạo.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION FOOTER */}
              {roomInstances.length > ITEMS_PER_PAGE && (
                <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-slate-50 border-t border-slate-100 gap-4">
                  <span className="text-xs text-slate-500 font-medium">
                    Hiển thị <span className="font-bold">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, roomInstances.length)}</span> trên tổng số <span className="font-bold">{roomInstances.length}</span> phòng
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-all"
                    >
                      <FaChevronLeft size={10} />
                    </button>

                    {/* Render Page Numbers (Simple version) */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                      .map((num, index, array) => (
                        <React.Fragment key={num}>
                          {index > 0 && array[index - 1] !== num - 1 && <span className="text-slate-400 px-1">...</span>}
                          <button
                            onClick={() => paginate(num)}
                            className={`min-w-[32px] h-8 rounded-lg text-xs font-bold border transition-all ${currentPage === num
                              ? "bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                              }`}
                          >
                            {num}
                          </button>
                        </React.Fragment>
                      ))}

                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-white transition-all"
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RoomManagementPage;