// src/pages/admin/CustomerManagement.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineBan,
  HiOutlineEye,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiOutlineMail,
  HiOutlinePhone
} from 'react-icons/hi';
import { toast } from 'react-toastify';
// Xóa import searchCustomers đi vì chúng ta sẽ tự lọc siêu tốc trên Frontend
import { getAllCustomers, deleteCustomer, Customer } from '../apis/api_user';
import Swal from 'sweetalert2';

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Lưu TOÀN BỘ khách hàng vào đây (Chỉ gọi API 1 lần)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]); 
  const[searchTerm, setSearchTerm] = useState('');

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- HÀM LOAD DỮ LIỆU TỪ SERVER ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllCustomers(); // Lấy tất cả data
      setAllCustomers(Array.isArray(data) ? data :[]);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khách hàng:', error);
      toast.error("Lỗi khi tải dữ liệu khách hàng");
    } finally {
      setLoading(false);
    }
  };

  // Chỉ gọi API 1 lần duy nhất khi vào trang
  useEffect(() => {
    fetchData();
  },[]);

  // --- 🌟 LOGIC TÌM KIẾM ĐA NĂNG TẠI CLIENT (TÌM ĐƯỢC CẢ SĐT) ---
  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return allCustomers;
    
    // Chuyển từ khóa về chữ thường và xóa khoảng trắng thừa
    const lowerKeyword = searchTerm.toLowerCase().trim();
    
    return allCustomers.filter(c => {
      const matchName = c.name?.toLowerCase().includes(lowerKeyword);
      const matchEmail = c.email?.toLowerCase().includes(lowerKeyword);
      const matchPhone = c.phone?.includes(lowerKeyword); // Lọc chính xác SĐT
      const matchId = c.id?.toLowerCase().includes(lowerKeyword);
      
      // Nếu khớp BẤT KỲ tiêu chí nào thì giữ lại
      return matchName || matchEmail || matchPhone || matchId;
    });
  }, [allCustomers, searchTerm]);

  // Reset về trang 1 mỗi khi gõ tìm kiếm mới
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);


  // --- XỬ LÝ PHÂN TRANG (Dựa trên danh sách ĐÃ TÌM KIẾM) ---
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  
  // Đảm bảo không bị lỗi trang trống khi xóa
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredCustomers.length, totalPages, currentPage]);

  const currentCustomers = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCustomers, currentPage, itemsPerPage]);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // --- DELETE ACTION ---
  const handleDeleteCustomer = async (id: string) => {
    const result = await Swal.fire({
      title: "CẢNH BÁO!",
      html: `
      <p><b>Xóa khách hàng này sẽ:</b></p>
      <ul style="text-align:left; margin-top:8px">
        <li>❌ Xóa toàn bộ lịch sử đặt vé</li>
        <li>❌ Không thể khôi phục dữ liệu</li>
      </ul>
      <p style="color:#d33; margin-top:8px">Bạn có chắc chắn muốn tiếp tục?</p>
    `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "XÓA KHÁCH HÀNG",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      focusCancel: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-xl px-4 py-2',
        cancelButton: 'rounded-xl px-4 py-2'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCustomer(id);
      fetchData(); // Load lại data sau khi xóa
      toast.success("Đã xóa khách hàng thành công");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa khách hàng lúc này.");
    }
  };

  // --- UTILS ---
  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getRankBadge = (level?: string) => {
    const normalizedLevel = level?.toLowerCase() || '';
    if (normalizedLevel.includes('vip') || normalizedLevel.includes('platinum')) {
      return 'bg-violet-100 text-violet-700 border-violet-200';
    } else if (normalizedLevel.includes('gold') || normalizedLevel.includes('vàng')) {
      return 'bg-amber-100 text-amber-700 border-amber-200';
    } else if (normalizedLevel.includes('silver') || normalizedLevel.includes('bạc')) {
      return 'bg-slate-100 text-slate-700 border-slate-200';
    }
    return 'bg-emerald-50 text-emerald-600 border-emerald-200';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-8">
      {/* --- HEADER --- */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl">
              <HiOutlineUsers size={24} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Danh sách Khách hàng</h1>
          </div>
          <p className="text-sm text-gray-500 ml-14">
            Quản lý {filteredCustomers.length} thành viên trên hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Lọc số lượng */}
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm font-medium"
          >
            <option value={5}>5 dòng / trang</option>
            <option value={10}>10 dòng / trang</option>
            <option value={20}>20 dòng / trang</option>
            <option value={50}>50 dòng / trang</option>
          </select>

          {/* Thanh tìm kiếm Gõ là thấy */}
          <div className="relative group w-full sm:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors">
              <HiOutlineSearch size={20} />
            </span>
            <input
              type="text"
              placeholder="Tìm tên, email, sđt, mã ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-4 py-2.5 w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:bg-white focus:border-pink-500 transition-all text-sm"
            />
          </div>

          {/* Nút Refresh */}
          <button
            onClick={() => fetchData()}
            className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:text-pink-600 transition-all shadow-sm active:scale-95 flex items-center justify-center"
            title="Làm mới dữ liệu"
          >
            <span className={loading ? 'animate-spin inline-block' : ''}>
              <HiOutlineRefresh size={20} />
            </span>
          </button>
        </div>
      </div>

      {/* --- BẢNG DỮ LIỆU --- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center text-gray-400">
            <div className="w-12 h-12 border-4 border-pink-100 border-t-pink-500 rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-gray-500">Đang đồng bộ dữ liệu khách hàng...</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách hàng</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Liên hệ</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Chi tiêu & Hạng</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tham gia</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentCustomers.length > 0 ? currentCustomers.map(c => (
                    <tr key={c.id} className="hover:bg-pink-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm
                              ${(c.name?.length || 0) % 2 === 0 ? 'bg-gradient-to-br from-indigo-500 to-blue-600' : 'bg-gradient-to-br from-pink-500 to-rose-500'}
                            `}>
                            {c.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 group-hover:text-pink-600 transition-colors">{c.name || 'Chưa đặt tên'}</p>
                            <p className="text-xs text-gray-400 mt-0.5 font-mono">ID: {c.id?.slice(-8) || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <p className="text-sm text-gray-600 flex items-center gap-2">
                            <HiOutlineMail className="text-gray-400" /> {c.email || '---'}
                          </p>
                          {c.phone && (
                            <p className="text-sm text-gray-600 flex items-center gap-2">
                              <HiOutlinePhone className="text-gray-400" /> {c.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${getRankBadge(c.membershipLevel)}`}>
                            {c.membershipLevel || 'Thành viên mới'}
                          </span>
                          <p className="text-sm font-bold text-gray-700 flex items-center gap-1 mt-1">
                            <HiOutlineCurrencyDollar className="text-emerald-500" size={16} />
                            {formatCurrency(c.totalSpent)}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <div className="p-1.5 bg-gray-100 rounded-lg text-gray-500">
                            <HiOutlineCalendar size={16} />
                          </div>
                          <span className="font-medium">{formatDate(c.createdAt)}</span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => navigate(`/users/customers/detail/${c.id}`)}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                            title="Xem chi tiết"
                          >
                            <HiOutlineEye size={18} />
                          </button>
                          <button
                            className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
                            title="Khóa tài khoản"
                          >
                            <HiOutlineBan size={18} />
                          </button>
                          <button
                            onClick={() => c.id && handleDeleteCustomer(c.id)}
                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <HiOutlineTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <HiOutlineUsers size={32} className="text-gray-300" />
                          </div>
                          <p className="text-gray-500 font-medium text-lg">Không tìm thấy dữ liệu</p>
                          <p className="text-gray-400 text-sm mt-1">
                            {searchTerm ? `Không có kết quả nào khớp với "${searchTerm}".` : 'Hệ thống hiện chưa có khách hàng nào.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {filteredCustomers.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50">
                <div className="text-sm text-gray-500">
                  Hiển thị <span className="font-bold text-gray-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến{' '}
                  <span className="font-bold text-gray-900">
                    {Math.min(currentPage * itemsPerPage, filteredCustomers.length)}
                  </span>{' '}
                  trong tổng số <span className="font-bold text-gray-900">{filteredCustomers.length}</span> khách hàng
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <HiChevronLeft size={20} />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      totalPages > 5 &&
                      page !== 1 && page !== totalPages &&
                      Math.abs(page - currentPage) > 1
                    ) {
                      if (page === 2 || page === totalPages - 1) {
                        return <span key={page} className="px-2 text-gray-400">...</span>;
                      }
                      return null;
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-pink-600 text-white shadow-md shadow-pink-500/20'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <HiChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;