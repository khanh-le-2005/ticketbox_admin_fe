import React, { useState, useEffect } from "react";
import {
  FaHotel, FaPlus, FaSearch, FaEdit, FaTrash, FaStar, FaMapMarkerAlt,
  FaChartPie, FaUserFriends, FaMoneyBillWave, FaBed, FaFilter
} from "react-icons/fa";
import hotelApi from "@/apis/hotelApi";
import { Hotel } from "@/type";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import Swal from "sweetalert2";

const FALLBACK_IMAGE = "https://placehold.co/150?text=No+Image";
const IMAGE_BASE_URL = "https://api.momangshow.vn/api/images";

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res: any = await hotelApi.getAll();

      let contentList = [];
      let pageInfo = null;

      if (res?.data?.content) {
        contentList = res.data.content;
        pageInfo = res.data;
      } else if (res?.data?.data?.content) {
        contentList = res.data.data.content;
        pageInfo = res.data.data;
      } else if (res?.content) {
        contentList = res.content;
        pageInfo = res;
      }

      if (pageInfo) setTotalElements(pageInfo.totalElements || 0);

      const mappedData = Array.isArray(contentList) ? contentList.map((h: any) => ({
        ...h,
        rating: h.rating || 5.0,
        avatarUrl: (h.galleryImageIds && h.galleryImageIds.length > 0)
          ? `${IMAGE_BASE_URL}/${h.galleryImageIds[0]}`
          : FALLBACK_IMAGE
      })) : [];

      setHotels(mappedData);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
      toast.error("Không thể tải danh sách khách sạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== FALLBACK_IMAGE) target.src = FALLBACK_IMAGE;
  };

  const handleNavigateCreate = () => navigate("/hotels/create");
  const handleNavigateEdit = (id: string) => {
    // Chuyển hướng đến /hotels/edit/ + ID của khách sạn
    navigate(`/hotels/edit/${id}`);
  };
  const handleViewDashboard = (id: string) => navigate(`/hotels/${id}/dashboard`);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Xóa khách sạn?",
      text: "Bạn có chắc chắn muốn xóa khách sạn này không? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await hotelApi.delete(id);
      setHotels(prev => prev.filter(h => h.id !== id));
      toast.success("Đã xóa thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Lỗi khi xóa khách sạn.");
    }
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 flex items-center gap-3 tracking-tight">
              <span className="bg-orange-100 p-2 rounded-lg text-orange-600">
                <FaHotel size={24} />
              </span>
              Quản Lý Khách Sạn
            </h1>
            <p className="text-slate-500 mt-2 text-sm font-medium">
              Quản lý danh sách, phòng ốc và trạng thái hoạt động của hệ thống khách sạn.
            </p>
          </div>

          <button
            onClick={handleNavigateCreate}
            className="w-full lg:w-auto group bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 font-semibold"
          >
            <FaPlus className=" transition-transform duration-300" />
            Thêm Khách Sạn Mới
          </button>
        </div>

        {/* Stats & Search Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Stat Card */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FaHotel size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Tổng khách sạn</p>
              <p className="text-2xl font-bold text-slate-800">{totalElements}</p>
            </div>
          </div>

          {/* Search Box */}
          <div className="lg:col-span-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center">
            <div className="pl-4 text-slate-400">
              <FaSearch size={18} />
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm khách sạn theo tên, địa chỉ..."
              className="w-full p-3 bg-transparent outline-none text-slate-700 placeholder-slate-400 font-medium text-sm md:text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mr-4 text-slate-400 hover:text-slate-600 text-sm font-bold whitespace-nowrap"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col justify-center items-center text-slate-500">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-orange-500 mb-4"></div>
              <p className="font-medium animate-pulse">Đang tải dữ liệu hệ thống...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="p-5 w-24 text-center">Hình ảnh</th>
                    <th className="p-5">Thông tin khách sạn</th>
                    <th className="p-5">Loại phòng & Sức chứa</th>
                    <th className="p-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHotels.length > 0 ? (
                    filteredHotels.map((hotel: Hotel) => (
                      <tr
                        key={hotel.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="p-5 align-top">
                          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-md border border-slate-100 relative group-hover:scale-105 transition-transform duration-300">
                            <img
                              src={hotel.avatarUrl}
                              alt={hotel.name}
                              className="w-full h-full object-cover"
                              onError={handleImageError}
                            />
                            <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm flex items-center gap-0.5">
                              {hotel.rating} <FaStar size={8} />
                            </div>
                          </div>
                        </td>

                        <td className="p-5 align-top max-w-sm">
                          <div className="flex flex-col h-full justify-between">
                            <div>
                              <h3 className="font-bold text-slate-800 text-lg group-hover:text-orange-600 transition-colors mb-1">
                                {hotel.name}
                              </h3>
                              <p className="text-sm text-slate-500 flex items-start gap-1.5 leading-relaxed">
                                <FaMapMarkerAlt className="text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{hotel.address}</span>
                              </p>
                            </div>

                            <div className="mt-3 inline-flex items-center gap-2">
                              <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold border border-green-100 flex items-center gap-1">
                                <FaMoneyBillWave />
                                {formatCurrency(hotel.minPrice)}
                              </span>
                              <span className="text-slate-400 text-xs">/ đêm</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-5 align-top">
                          {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
                            <div className="space-y-2.5">
                              {hotel.roomTypes.slice(0, 3).map((rt: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-white rounded-md text-blue-500 shadow-sm">
                                      <FaBed size={12} />
                                    </div>
                                    <span className="font-semibold text-slate-700">{rt.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-500">
                                    <span title="Số lượng phòng" className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                      <span className="font-bold text-slate-700">{rt.totalRooms}</span> phòng
                                    </span>
                                    <span title="Giá ngày thường" className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100 text-orange-600 font-bold">
                                      {formatCurrency(rt.priceMonToThu || 0)}
                                    </span>
                                    <span title="Sức chứa" className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                      <FaUserFriends className="text-slate-400" /> {rt.standardCapacity}-{rt.maxCapacity}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {hotel.roomTypes.length > 3 && (
                                <div className="text-center">
                                  <span className="text-xs text-slate-400 font-medium hover:text-orange-500 cursor-pointer transition-colors">
                                    +{hotel.roomTypes.length - 3} loại phòng khác
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-slate-400 text-sm italic bg-slate-50 p-3 rounded-lg border border-dashed border-slate-200">
                              <FaBed /> Chưa có thông tin phòng
                            </div>
                          )}

                          <div className="mt-3">
                            <Link
                              to={`/hotels/${hotel.id}/rooms`}
                              className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline decoration-2 underline-offset-2 transition-all"
                            >
                              Quản lý danh sách phòng <span className="text-lg leading-none">&rsaquo;</span>
                            </Link>
                          </div>
                        </td>

                        <td className="p-5 align-top text-right">
                          <div className="flex flex-col gap-2 items-end">
                            <button
                              onClick={() => handleViewDashboard(hotel.id)}
                              className="w-full md:w-auto px-3 py-1.5 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border border-purple-100"
                            >
                              <FaChartPie /> Dashboard
                            </button>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleNavigateEdit(hotel.id)}
                                className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 rounded-lg transition-all border border-blue-100 shadow-sm"
                                title="Chỉnh sửa thông tin"
                              >
                                <FaEdit size={14} />
                              </button>

                              <button
                                onClick={() => handleDelete(hotel.id)}
                                className="p-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-lg transition-all border border-red-100 shadow-sm"
                                title="Xóa khách sạn"
                              >
                                <FaTrash size={14} />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-300">
                          <FaHotel size={48} className="mb-4 opacity-50" />
                          <p className="text-lg font-medium text-slate-500">Không tìm thấy khách sạn nào</p>
                          <p className="text-sm">Thử thay đổi từ khóa tìm kiếm hoặc thêm mới.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelManagement;