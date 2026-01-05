import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineLocationMarker,
} from "react-icons/hi";

// 🔥 SỬA IMPORT: Thêm IShow và dùng ngoặc nhọn
import { IShow } from "@/type";
import { showApi } from "@/apis";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/util/querykey";

const ShowManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // 1. Tạo state cho bộ lọc (Ví dụ mặc định lấy UPCOMING)
  const [filter, setFilter] = useState({
    page: 0,
    size: 10,
    // status: "UPCOMING", // Nếu bạn muốn admin chỉ hiện show sắp tới thì bỏ comment dòng này
    keyword: search, // Truyền search vào đây
  });

  // 2. Cập nhật queryKey để nó bao gồm biến 'filter'
  const {
    isLoading: loading,
    data: shows = [],
    refetch,
  } = useQuery({
    // 🔥 QUAN TRỌNG: Thêm 'filter' vào mảng này. Khi filter đổi, API tự gọi lại.
    queryKey: [QueryKey.getAllShow, filter, search],

    // 🔥 Gọi API với tham số
    queryFn: () =>
      showApi.getAllShows({
        ...filter,
        keyword: search, // Ưu tiên lấy từ state search
      }),
  });

  console.log("Data show:", shows);

  const handleDelete = async (id: string) => {
    // Hỏi xác nhận trước khi xóa
    const confirmDelete = window.confirm(
      "Bạn có chắc chắn muốn HỦY hoặc XÓA show diễn này không?\n\n- Nếu chưa bán vé: Show sẽ bị XÓA vĩnh viễn.\n- Nếu đã bán vé: Show sẽ chuyển sang trạng thái HỦY."
    );

    if (!confirmDelete) return;

    try {
      // Gọi API cancelShow (Lưu ý: Backend yêu cầu POST, token đã được xử lý trong api_show.ts)
      const response: any = await showApi.cancelShow(id);

      // Lấy thông báo từ Server trả về
      const message = response?.message || "Thao tác thành công!";

      alert(`✅ ${message}`);

      // Tự động tải lại danh sách sau khi xóa thành công
      queryClient.invalidateQueries({ queryKey: [QueryKey.getAllShow] });
    } catch (error: any) {
      console.error("Lỗi xóa show:", error);
      // Hiển thị lỗi từ Backend (ví dụ: Không có quyền, show đang diễn ra...)
      const errorMessage =
        error?.response?.data?.message || "Lỗi hệ thống: Không thể xóa show.";
      alert(`⚠️ THẤT BẠI: ${errorMessage}`);
    }
  };

  // Helper format thời gian
  const formatDateTime = (isoString: string) => {
    if (!isoString) return "Chưa thiết lập";
    try {
      // Backend trả về: "2025-12-31 20:00:00" hoặc "2025-12-31T20:00:00"
      // Date constructor của JS xử lý tốt cả 2 nếu đúng chuẩn ISO hoặc RFC2822
      // Nếu là khoảng trắng, replace thành T để an toàn
      const safeString = isoString.replace(" ", "T");
      const date = new Date(safeString);

      if (isNaN(date.getTime())) return isoString;

      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();

      return `${hours}:${minutes} - ${day}/${month}/${year}`;
    } catch (e) {
      return isoString;
    }
  };

  // Lọc dữ liệu tìm kiếm
  // const filteredShows = shows.filter(
  //   (s) =>
  //     (s.name && s.name.toLowerCase().includes(search.toLowerCase())) ||
  //     (s.address?.province &&
  //       s.address.province.toLowerCase().includes(search.toLowerCase())) ||
  //     // 🔥 SỬA: Logic tìm kiếm theo name hoặc email của Organizer
  //     ((s.organizer?.name || s.organizer?.email) &&
  //       (s.organizer?.name || s.organizer?.email)
  //         .toLowerCase()
  //         .includes(search.toLowerCase()))
  // );

  const fetchShows = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.getAllShow],
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Quản lý Show Diễn
          </h1>
          <p className="text-gray-500 text-sm">
            Lịch trình sự kiện và danh sách nghệ sĩ vận hành.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchShows}
            className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Làm mới dữ liệu"
          >
            <HiOutlineRefresh
              size={22}
              className={loading ? "animate-spin" : ""}
            />
          </button>
          <button
            onClick={() => navigate("/shows/add")}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 active:scale-95 text-sm"
          >
            <HiOutlinePlus size={20} />
            <span>Tạo Show</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        {/* Search Bar */}
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên show, tỉnh thành, ban tổ chức..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-sm font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-32 flex flex-col items-center justify-center text-gray-400">
              <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-medium tracking-wide uppercase text-[10px] font-bold">
                Đang tải dữ liệu...
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Sự Kiện</th>
                  <th className="px-6 py-4">Thời Gian</th>
                  <th className="px-6 py-4">Địa Điểm</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shows.length > 0 ? (
                  shows.map((show) => (
                    <tr
                      key={show.id}
                      className="hover:bg-gray-50/30 transition-colors"
                    >
                      {/* Cột 1: Ảnh + Tên + BTC */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shadow-sm flex-shrink-0 relative">
                            {/* Xử lý hiển thị ảnh từ bannerImageId */}
                            {show.bannerImageId ? (
                              <img
                                src={showApi.getImageUrl(show.bannerImageId)}
                                alt={show.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/150?text=No+Img";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <HiOutlinePhotograph size={20} />
                              </div>
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p
                              className="font-bold text-gray-900 truncate max-w-[200px]"
                              title={show.name}
                            >
                              {show.name}
                            </p>
                            {/* 🔥 SỬA: Hiển thị tên Organizer theo JSON mới */}
                            <p className="text-[11px] text-gray-500 truncate">
                              {show.organizer?.name ||
                                show.organizer?.email ||
                                "BTC ẩn danh"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 2: Thời gian */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                          <HiOutlineClock className="text-pink-500" size={16} />
                          {formatDateTime(show.startTime)}
                        </div>
                      </td>

                      {/* Cột 3: Địa điểm */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-700 text-sm">
                          <HiOutlineLocationMarker className="text-gray-400" />
                          <span
                            className="truncate max-w-[150px]"
                            title={show.address?.fullAddress}
                          >
                            {show.address?.province || "Chưa cập nhật"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Trạng thái */}
                      <td className="px-6 py-4">
                        {show.status === "UPCOMING" ? (
                          <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-green-100">
                            Sắp diễn ra
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                            {show.status}
                          </span>
                        )}
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/shows/edit/${show.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <HiOutlinePencil size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(show.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-20 text-center text-gray-400 italic"
                    >
                      Không tìm thấy show diễn nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowManagement;
