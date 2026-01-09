// src/pages/admin/CustomerManagement.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineTrash,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineSearch,
  HiOutlineBan,
  HiOutlineEye,
  HiOutlineCurrencyDollar,
  HiOutlineCalendar
} from 'react-icons/hi';
import { toast } from 'react-toastify'; // 👈 Import Toast
// 👇 Đảm bảo import searchCustomers từ file api
import { getAllCustomers, deleteCustomer, searchCustomers, Customer } from '../apis/api_user';

const CustomerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // --- HÀM LOAD DỮ LIỆU (HỖ TRỢ TÌM KIẾM SERVER-SIDE) ---
  const fetchData = async (keyword = '') => {
    setLoading(true);
    try {
      let data;
      // Nếu có từ khóa -> Gọi API tìm kiếm
      if (keyword.trim()) {
        data = await searchCustomers(keyword);
      } 
      // Nếu không -> Gọi API lấy tất cả
      else {
        data = await getAllCustomers();
      }

      // Đảm bảo data là mảng
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- EFFECT: DEBOUNCE SEARCH ---
  // Tự động gọi API sau khi ngừng gõ 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDeleteCustomer = async (id: string) => {
    if (window.confirm('CẢNH BÁO: Xóa khách hàng này sẽ xóa toàn bộ lịch sử đặt vé. Bạn có chắc chắn?')) {
      try {
        await deleteCustomer(id);
        // Xóa xong thì load lại dữ liệu hiện tại
        fetchData(searchTerm);
        toast.success('Đã xóa khách hàng thành công'); // Thay alert success
      } catch (error) {
        console.error(error);
        toast.error('Không thể xóa khách hàng lúc này.'); // Thay alert error
      }
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineUsers className="text-pink-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Khách hàng</h1>
          </div>
          <p className="text-gray-500">Danh sách người dùng đăng ký ứng dụng ({customers.length} kết quả).</p>
        </div>
        <div className="flex gap-2">
          <div className="relative group">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500 transition-colors" size={20} />
            <input
              type="text"
              placeholder="Tìm theo tên, email, sđt..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} // Thay đổi state sẽ trigger useEffect ở trên
              className="pl-10 pr-4 py-3 w-64 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all shadow-sm"
            />
          </div>
          <button
            onClick={() => fetchData(searchTerm)}
            className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Làm mới"
          >
            <HiOutlineRefresh size={22} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Đang tải dữ liệu khách hàng...</p>
          </div>
        ) : (
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Thông tin Khách hàng</th>
                    <th className="px-6 py-4">Liên hệ</th>
                    <th className="px-6 py-4">Chi tiêu & Hạng</th>
                    <th className="px-6 py-4">Ngày tham gia</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.length > 0 ? customers.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm
                              ${(c.name?.length || 0) % 2 === 0 ? 'bg-gradient-to-br from-blue-400 to-blue-600' : 'bg-gradient-to-br from-purple-400 to-purple-600'}
                            `}>
                            {c.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{c.name || 'Chưa đặt tên'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">ID: {c.id?.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <div className="space-y-1">
                          <p className="font-mono text-xs flex items-center gap-1.5">
                            <span className="text-gray-400">📧</span> {c.email || '---'}
                          </p>
                          {c.phone && (
                            <p className="font-mono text-xs flex items-center gap-1.5 text-gray-500">
                              <span className="text-gray-400">📱</span> {c.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                            <HiOutlineCurrencyDollar />
                            {formatCurrency(c.totalSpent)}
                          </p>
                          {c.membershipLevel ? (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-[10px] font-bold uppercase">
                              {c.membershipLevel}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Thành viên mới</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                          <HiOutlineCalendar className="text-gray-400" />
                          <span className="font-mono text-xs">{formatDate(c.createdAt)}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/users/customers/detail/${c.id}`)}
                            className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Xem chi tiết & Lịch sử"
                          >
                            <HiOutlineEye size={20} />
                          </button>

                          <button
                            className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Khóa tài khoản"
                          >
                            <HiOutlineBan size={20} />
                          </button>

                          <button
                            onClick={() => c.id && handleDeleteCustomer(c.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa vĩnh viễn"
                          >
                            <HiOutlineTrash size={20} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                        {searchTerm ? 'Không tìm thấy khách hàng nào khớp với từ khóa.' : 'Chưa có khách hàng nào trong hệ thống.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerManagement;