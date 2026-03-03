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
  HiOutlineDuplicate,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineCalendar,
  HiOutlineTicket,
} from "react-icons/hi";

import { IShow } from "@/type";
import { showApi } from "@/apis/api_show";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/util/querykey";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const ShowManagement: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- LOGIC GIỮ NGUYÊN ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState({
    page: 0,
    size: 10,
    keyword: "",
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilter((prev) => ({
        ...prev,
        keyword: searchTerm,
        page: 0,
      }));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const {
    isLoading: loading,
    data: responseData,
    refetch,
  } = useQuery({
    queryKey: [QueryKey.getAllShow, filter],
    queryFn: () => showApi.getAllShows(filter),
    keepPreviousData: true,
  });

  // Safe destructuring
  const shows: IShow[] = responseData?.content || (Array.isArray(responseData) ? responseData : []) || [];
  const totalPages = responseData?.totalPages || 1;
  const totalElements = responseData?.totalElements || 0;

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Xác nhận thao tác",
      html: `
        <div class="text-left">
          <p class="mb-2">Bạn muốn xóa show này?</p>
          <div class="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-600">
            <p>❌ <b>Chưa bán vé:</b> Xóa vĩnh viễn.</p>
            <p>⚠️ <b>Đã bán vé:</b> Chuyển thành ĐÃ HỦY.</p>
          </div>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận xóa",
      cancelButtonText: "Quay lại",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl font-bold",
        cancelButton: "rounded-xl font-medium",
      }
    });

    if (!result.isConfirmed) return;

    try {
      const response: any = await showApi.cancelShow(id);
      const message = response?.message || "Thao tác thành công!";
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: [QueryKey.getAllShow] });
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Lỗi hệ thống: Không thể xóa show.";
      toast.error(`⚠️ ${errorMessage}`);
    }
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return "Chưa thiết lập";
    try {
      const safeString = isoString.replace(" ", "T");
      const date = new Date(safeString);
      if (isNaN(date.getTime())) return isoString;
      
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date);
    } catch (e) {
      return isoString;
    }
  };

  const fetchShows = () => {
    queryClient.invalidateQueries({
      queryKey: [QueryKey.getAllShow],
    });
  };

  const handleDuplicate = async (show: IShow) => {
    const result = await Swal.fire({
      title: "Sao chép Show?",
      text: `Tạo bản sao mới từ "${show.name}"`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Tạo bản sao",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#8b5cf6",
      customClass: {
        popup: "rounded-2xl",
        confirmButton: "rounded-xl font-bold",
        cancelButton: "rounded-xl font-medium",
      }
    });

    if (!result.isConfirmed) return;
    navigate("/shows/add", { state: { copiedShow: show } });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setFilter((prev) => ({ ...prev, page: newPage }));
    }
  };
  // --- KẾT THÚC LOGIC ---

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 sm:p-10 font-sans text-slate-900 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                <HiOutlineTicket size={24} />
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Show
            </h1>
          </div>
          <p className="text-slate-500 font-medium ml-1">
            Danh sách sự kiện và trạng thái vận hành vé.
          </p>
        </div>

        <div className="flex items-center gap-3">
            <button
                onClick={fetchShows}
                className="group p-3 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-white hover:border-pink-200 hover:text-pink-500 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300 active:scale-95"
                title="Làm mới"
            >
                <HiOutlineRefresh size={22} className={`group-hover:rotate-180 transition-transform duration-500 ${loading ? "animate-spin" : ""}`} />
            </button>

            <button
                onClick={() => navigate("/shows/add")}
                className="relative overflow-hidden flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-xl shadow-slate-900/20 active:scale-95 group"
            >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-pink-500 to-rose-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center gap-2">
                    <HiOutlinePlus size={20} />
                    <span>Tạo Show Mới</span>
                </span>
            </button>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="max-w-7xl mx-auto bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col min-h-[600px]">
        
        {/* TOOLBAR */}
        <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            {/* Search */}
            <div className="relative w-full md:max-w-md group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiOutlineSearch className="text-slate-400 group-focus-within:text-pink-500 transition-colors" size={20} />
                </div>
                <input
                    type="text"
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border-transparent text-slate-900 placeholder-slate-400 rounded-2xl focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 transition-all duration-300 font-medium"
                    placeholder="Tìm kiếm show, nghệ sĩ, địa điểm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Stats Badge (Optional visualization) */}
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500 bg-slate-50 px-5 py-2.5 rounded-2xl">
                <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                    Sắp diễn ra
                </span>
                <div className="w-px h-4 bg-slate-200"></div>
                <span>Tổng: <b className="text-slate-900">{totalElements}</b></span>
            </div>
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-x-auto relative">
          {loading && shows.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-20">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-pink-500 rounded-full animate-spin mb-4 shadow-lg shadow-pink-500/20"></div>
                <p className="text-slate-500 font-medium text-sm animate-pulse">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-8 py-5">Thông tin Show</th>
                  <th className="px-6 py-5">Thời gian & Địa điểm</th>
                  <th className="px-6 py-5 text-center">Trạng thái</th>
                  <th className="px-8 py-5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {shows.length > 0 ? (
                  shows.map((show) => (
                    <tr
                      key={show.id}
                      className="group hover:bg-slate-50/80 transition-colors duration-200"
                    >
                      {/* Column 1: Info */}
                      <td className="px-8 py-5 align-top">
                        <div className="flex gap-5">
                          <div className="w-24 h-16 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-sm relative group-hover:shadow-md transition-all">
                            {show.bannerImageId ? (
                              <img
                                src={showApi.getImageUrl(show.bannerImageId)}
                                alt={show.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "https://via.placeholder.com/150?text=No+Img";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <HiOutlinePhotograph size={24} />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <h3 className="font-bold text-slate-800 text-base mb-1 line-clamp-1 group-hover:text-pink-600 transition-colors" title={show.name}>
                              {show.name}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-500 text-xs font-medium">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 truncate max-w-[150px]">
                                    {show.organizer?.name || show.organizer?.email || "BTC Ẩn danh"}
                                </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Date & Place */}
                      <td className="px-6 py-5 align-middle">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2.5 text-slate-600 text-sm font-medium">
                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                    <HiOutlineCalendar size={16} />
                                </div>
                                <span>{formatDateTime(show.startTime)}</span>
                            </div>
                            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
                                <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                                    <HiOutlineLocationMarker size={16} />
                                </div>
                                <span className="truncate max-w-[180px]" title={show.address?.fullAddress}>
                                    {show.address?.province || "Chưa xác định"}
                                </span>
                            </div>
                        </div>
                      </td>

                      {/* Column 3: Status */}
                      <td className="px-6 py-5 align-middle text-center">
                        {show.status === "UPCOMING" ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-600 border border-green-100 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                            SẮP DIỄN RA
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                            {show.status}
                          </span>
                        )}
                      </td>

                      {/* Column 4: Actions */}
                      <td className="px-8 py-5 align-middle">
                        <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Duplicate */}
                            <button
                                onClick={() => handleDuplicate(show)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-purple-600 bg-purple-50 hover:bg-purple-100 hover:scale-110 transition-all duration-200"
                                title="Sao chép show"
                            >
                                <HiOutlineDuplicate size={18} />
                            </button>

                            {/* Edit */}
                            <button
                                onClick={() => navigate(`/shows/edit/${show.id}`)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                                title="Chỉnh sửa"
                            >
                                <HiOutlinePencil size={18} />
                            </button>

                            {/* Delete */}
                            <button
                                onClick={() => handleDelete(show.id)}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:scale-110 transition-all duration-200"
                                title="Xóa / Hủy"
                            >
                                <HiOutlineTrash size={18} />
                            </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-32 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <HiOutlineSearch className="text-slate-300" size={40} />
                            </div>
                            <h3 className="text-slate-900 font-bold text-lg">Không tìm thấy kết quả</h3>
                            <p className="text-slate-500 text-sm mt-1">Thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* FOOTER & PAGINATION */}
        <div className="border-t border-slate-100 p-6 bg-slate-50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm font-medium text-slate-500">
            Hiển thị trang <span className="text-slate-900 font-bold">{filter.page + 1}</span> / <span className="text-slate-900 font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center bg-white p-1 rounded-xl shadow-sm border border-slate-200">
            <button
              onClick={() => handlePageChange(filter.page - 1)}
              disabled={filter.page === 0 || loading}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronLeft size={20} />
            </button>

            <div className="flex items-center px-2 gap-1">
                {/* Logic hiển thị số trang rút gọn */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i; 
                    if (totalPages > 5) {
                        if (filter.page > 2 && filter.page < totalPages - 2) {
                            pageNum = filter.page - 2 + i;
                        } else if (filter.page >= totalPages - 2) {
                            pageNum = totalPages - 5 + i;
                        }
                    }
                    return (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200 ${
                                filter.page === pageNum 
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-105" 
                                    : "text-slate-500 hover:bg-slate-100"
                            }`}
                        >
                            {pageNum + 1}
                        </button>
                    )
                  })}
            </div>

            <button
              onClick={() => handlePageChange(filter.page + 1)}
              disabled={filter.page >= totalPages - 1 || loading}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-pink-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronRight size={20} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShowManagement;