import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import hotelApi from "@/apis/hotelApi";
import { Hotel } from "@/type";
import axiosClient from "@/axiosclient";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaBed,
  FaUserCheck,
  FaBroom,
  FaTools,
} from "react-icons/fa";

// --- INTERFACES ---

interface RoomInstance {
  id: string;
  hotelId: string;
  roomNumber: string;
  status: string;
  roomTypeCode: string;
  roomTypeName: string;
  createdAt: string;
}

interface DashboardGroup {
  count: number;
  rooms: { id: string; roomNumber: string }[];
}

interface DashboardData {
  available: DashboardGroup;
  occupied: DashboardGroup;
  dirty: DashboardGroup;
  maintenance: DashboardGroup;
}

const RoomManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE ---
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>("");

  const [roomInstances, setRoomInstances] = useState<RoomInstance[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardData | null>(
    null
  );

  const [loading, setLoading] = useState(false);
  const [hotelName, setHotelName] = useState("Đang tải...");

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

        const currentHotel = hotels.find((h) => h.id === selectedHotelId);
        if (currentHotel) setHotelName(currentHotel.name);

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
        } else {
          setRoomInstances([]);
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        setRoomInstances([]);
        setDashboardStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedHotelId, hotels]);

  // --- UI HANDLERS ---
  const handleHotelChange = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setSelectedHotelId(e.target.value);
  const handleCreateRoom = () =>
    navigate(`/rooms/create?hotelId=${selectedHotelId}`);

  // Helper Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return (
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-200">
            Sẵn sàng
          </span>
        );
      case "OCCUPIED":
        return (
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-200">
            Đang ở
          </span>
        );
      case "DIRTY":
        return (
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200">
            Chưa dọn
          </span>
        );
      case "MAINTENANCE":
        return (
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-200">
            Bảo trì
          </span>
        );
      default:
        return (
          <span className="bg-gray-50 text-gray-500 px-3 py-1 rounded-full text-xs border border-gray-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
      {/* HEADER & FILTER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-orange-500">🏨</span> Quản Lý Phòng
          </h1>
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <label className="text-sm font-medium text-gray-600 pl-2">
              Khách sạn:
            </label>
            <select
              value={selectedHotelId}
              onChange={handleHotelChange}
              className="outline-none text-gray-700 font-semibold bg-transparent cursor-pointer min-w-[250px]"
            >
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCreateRoom}
          className="bg-orange-600 text-white px-5 py-2.5 rounded-lg hover:bg-orange-700 flex items-center gap-2 shadow-md transition-all font-medium active:scale-95"
        >
          <FaPlus /> Thêm phòng mới
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-500 font-medium">
            Đang tải dữ liệu...
          </span>
        </div>
      ) : (
        <>
          {/* --- DASHBOARD STATS --- */}
          {dashboardStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl border-l-4 border-green-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">
                    Sẵn sàng
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats.available.count}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-full text-green-500">
                  <FaBed size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-blue-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">
                    Đang ở
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardStats.occupied.count}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full text-blue-500">
                  <FaUserCheck size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-yellow-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">
                    Chưa dọn
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardStats.dirty.count}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-full text-yellow-500">
                  <FaBroom size={20} />
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border-l-4 border-red-500 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">
                    Bảo trì
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboardStats.maintenance.count}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-full text-red-500">
                  <FaTools size={20} />
                </div>
              </div>
            </div>
          )}

          {/* --- DANH SÁCH PHÒNG --- */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-700">
                Danh sách phòng tại:{" "}
                <span className="text-orange-600">{hotelName}</span>
              </h3>
              <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-md font-medium">
                Tổng: {roomInstances.length} phòng
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-4">Số phòng</th>
                    <th className="px-6 py-4">Loại phòng</th>
                    <th className="px-6 py-4 text-center">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Ngày tạo</th>
                    <th className="px-6 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {roomInstances.length > 0 ? (
                    roomInstances.map((room) => (
                      <tr
                        key={room.id}
                        className="bg-white border-b hover:bg-gray-50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <span className="text-lg font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                            {/* Nếu gặp chữ "PHÒ", đổi thành "P." */}
                            {room.roomNumber.replace("PHÒ", "P")}
                          </span>
                          <div className="text-[10px] text-gray-400 mt-1">
                            ID: {room.id.slice(-6)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700">
                              {room.roomTypeName}
                            </span>
                            <span className="text-xs text-gray-400 font-mono mt-0.5">
                              {room.roomTypeCode.slice(0, 8)}...
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getStatusBadge(room.status)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                          {new Date(room.createdAt).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => navigate(`/rooms/edit/${room.id}`)}
                              className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded transition-colors"
                              title="Sửa"
                            >
                              <FaEdit size={16} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                              title="Xóa"
                            >
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-16 text-center text-gray-400 flex flex-col items-center justify-center"
                      >
                        <div className="bg-gray-100 p-4 rounded-full mb-3">
                          <FaSearch size={24} className="text-gray-300" />
                        </div>
                        <p className="font-medium">
                          Khách sạn này chưa có phòng vật lý nào.
                        </p>
                        <button
                          onClick={handleCreateRoom}
                          className="mt-3 text-orange-600 hover:underline font-medium text-sm"
                        >
                          + Tạo phòng ngay
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RoomManagementPage;
