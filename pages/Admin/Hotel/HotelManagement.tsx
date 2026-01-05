import React, { useState, useEffect } from "react";
import {
  FaHotel,
  FaPlus,
  FaSearch,
  FaEdit,
  FaTrash,
  FaStar,
  FaMapMarkerAlt,
} from "react-icons/fa";
import hotelApi from "@/apis/hotelApi";
import { Hotel } from "@/type";
import { Link, useNavigate } from "react-router-dom";

// Dùng link ảnh rỗng base64 an toàn tuyệt đối (không cần mạng) làm fallback cuối cùng
const FALLBACK_IMAGE = "https://placehold.co/150?text=No+Image";

const IMAGE_BASE_URL = "https://api.momangshow.vn/api/images"; 

const HotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalElements, setTotalElements] = useState(0);

  const navigate = useNavigate();

  // --- FETCH DATA (Giữ nguyên logic cũ của bạn) ---
  const fetchHotels = async () => {
    setLoading(true);
    try {
      const res: any = await hotelApi.getAll();
      
      let contentList = [];
      let pageInfo = null;

      // Logic bắt dữ liệu linh hoạt
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

      if (pageInfo) {
        setTotalElements(pageInfo.totalElements || 0);
      }
      
      const mappedData = Array.isArray(contentList) ? contentList.map((h: any) => ({
        ...h,
        rating: h.rating || 5.0,
        // Logic tạo URL ảnh
        avatarUrl: (h.galleryImageIds && h.galleryImageIds.length > 0)
          ? `${IMAGE_BASE_URL}/${h.galleryImageIds[0]}`
          : FALLBACK_IMAGE
      })) : [];

      setHotels(mappedData);
    } catch (error) {
      console.error("Lỗi tải danh sách:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  // --- HÀM XỬ LÝ LỖI ẢNH (QUAN TRỌNG: NGĂN LOOP) ---
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    // Kiểm tra: Chỉ gán lại nếu src hiện tại KHÁC ảnh fallback
    // Điều này ngăn chặn việc gán đi gán lại gây lặp vô tận
    if (target.src !== FALLBACK_IMAGE) {
        target.src = FALLBACK_IMAGE;
    }
  };

  // --- CÁC HANDLER KHÁC GIỮ NGUYÊN ---
  const handleNavigateCreate = () => navigate("/hotels/create");
  const handleNavigateEdit = (id: string) => navigate(`/hotels/edit/${id}`);

  const handleDelete = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khách sạn này?")) {
      try {
        await hotelApi.delete(id);
        setHotels(prev => prev.filter((h) => h.id !== id));
        alert("Đã xóa thành công!");
      } catch (error) {
        console.error(error);
        alert("Lỗi khi xóa khách sạn.");
      }
    }
  };

  const filteredHotels = hotels.filter(
    (h) =>
      h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FaHotel className="text-orange-500" /> Quản Lý Khách Sạn
          </h1>
          <p className="text-gray-500 text-sm">
             Hiển thị {filteredHotels.length} / {totalElements} kết quả
          </p>
        </div>

        <button
          onClick={handleNavigateCreate}
          className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <FaPlus /> Thêm Khách Sạn
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center gap-3">
        <FaSearch className="text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
          className="flex-1 outline-none text-gray-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mr-2"></div>
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 border-b w-24">Hình ảnh</th>
                  <th className="p-4 border-b">Tên & Địa chỉ</th>
                  <th className="p-4 border-b">Thông tin phòng</th>
                  <th className="p-4 border-b w-24 text-center">Đánh giá</th>
                  <th className="p-4 border-b text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredHotels.length > 0 ? (
                  filteredHotels.map((hotel: any) => (
                    <tr
                      key={hotel.id}
                      className="hover:bg-orange-50/30 transition-colors border-b last:border-0 group"
                    >
                      {/* --- CỘT HÌNH ẢNH ĐÃ SỬA LỖI --- */}
                      <td className="p-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                          <img
                            src={hotel.avatarUrl}
                            alt={hotel.name}
                            className="w-full h-full object-cover"
                            onError={handleImageError} // Sử dụng hàm handleImageError mới
                          />
                        </div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-orange-600 transition-colors">
                          {hotel.name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-start gap-1 mt-1">
                          <FaMapMarkerAlt className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{hotel.address}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1 italic">
                          {hotel.description || "Chưa có mô tả"}
                        </p>
                      </td>

                      <td className="p-4">
                        {hotel.roomTypes && hotel.roomTypes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {hotel.roomTypes.slice(0, 2).map((rt: any, idx: number) => (
                              <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                                {rt.name} ({rt.totalRooms}p)
                              </span>
                            ))}
                            {hotel.roomTypes.length > 2 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                +{hotel.roomTypes.length - 2} loại khác
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Chưa có loại phòng</span>
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <div className="inline-flex items-center px-2 py-1 bg-yellow-50 rounded-full border border-yellow-100">
                          <span className="font-bold text-gray-700 text-sm mr-1">
                            {hotel.rating}
                          </span>
                          <FaStar className="text-yellow-400 text-xs" />
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleNavigateEdit(hotel.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FaEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(hotel.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Xóa"
                          >
                            <FaTrash size={16} />
                          </button>
                        </div>
                        <div className="mt-2">
                            <Link
                            to={`/hotels/${hotel.id}/rooms`}
                            className="text-xs font-semibold text-orange-600 hover:text-orange-800 hover:underline inline-flex items-center gap-1"
                            >
                            Quản lý phòng <span className="text-[10px]">&rarr;</span>
                            </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-12 text-center">
                       <div className="flex flex-col items-center justify-center text-gray-400">
                          <FaHotel size={40} className="mb-3 opacity-20"/>
                          <p>Chưa có dữ liệu khách sạn nào.</p>
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
  );
};

export default HotelManagement;