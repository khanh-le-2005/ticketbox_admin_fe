import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineRefresh,
  HiOutlineUserGroup
} from 'react-icons/hi';
import { getAllStaff, deleteStaff, Staff } from '../apis/api_staff';

const StaffManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllStaff();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải danh sách nhân viên:', error);
      alert('Không thể tải danh sách nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteStaff = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài khoản nhân viên này không?')) {
      try {
        await deleteStaff(id);
        setStaffList(staffList.filter(s => s.id !== id));
        alert('Đã xóa tài khoản nhân viên');
      } catch (error) {
        console.error(error);
        alert('Không thể xóa nhân viên lúc này.');
      }
    }
  };

  const getRoleLabel = (role?: string) => {
    if (role === 'NHAN_VIEN') return 'Nhân viên';
    return role || 'Thành viên';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineUserGroup className="text-pink-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Nhân viên</h1>
          </div>
          <p className="text-gray-500">Đội ngũ vận hành và quản trị hệ thống.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Làm mới"
          >
            <HiOutlineRefresh size={22} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => navigate('/users/staff/add')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"
          >
            <HiOutlinePlus size={20} />
            Thêm Nhân Viên
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Đang đồng bộ dữ liệu nhân viên...</p>
          </div>
        ) : (
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Họ Và Tên</th>
                    <th className="px-6 py-4">Thông Tin Liên Hệ</th>
                    <th className="px-6 py-4">Vai Trò</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {staffList.length > 0 ? staffList.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-bold text-sm">
                                {(s.fullName ? s.fullName.charAt(0) : (s.username ? s.username.charAt(0) : '?')).toUpperCase()}
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">{s.fullName || s.username}</p>
                                <p className="text-[11px] text-gray-400">ID: {s.id?.substring(0, 8)}...</p>
                            </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        <div className="space-y-1">
                            <p className="font-mono flex items-center gap-1.5">
                                <span className="text-gray-400">@</span> {s.email}
                            </p>
                            {s.phone && (
                                <p className="text-xs text-gray-500 font-medium">
                                    📞 {s.phone}
                                </p>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-pink-100 text-pink-700">
                          {getRoleLabel(s.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/users/staff/edit/${s.id}`)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa thông tin"
                          >
                            <HiOutlinePencil size={20} />
                          </button>
                          <button 
                            onClick={() => s.id && handleDeleteStaff(s.id)} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa tài khoản"
                          >
                            <HiOutlineTrash size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic">
                        Chưa có nhân viên vận hành nào.
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

export default StaffManagement;