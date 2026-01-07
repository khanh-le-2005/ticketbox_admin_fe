import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlinePlus, 
  HiOutlinePencil, 
  HiOutlineTrash, 
  HiOutlineRefresh,
  HiOutlineOfficeBuilding,
  HiOutlinePhone, // ✅ Đã thêm icon điện thoại
  HiOutlineCheckCircle,
  HiOutlineBan
} from 'react-icons/hi';
// Import interface Company từ file api của bạn
import { getAllCompanies, deleteCompany, Company } from '../apis/api_company';

const CompanyManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response: any = await getAllCompanies();
      
      if (response && response.data && Array.isArray(response.data)) {
        setCompanies(response.data);
      } else if (Array.isArray(response)) {
        setCompanies(response);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh sách công ty:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteCompany = async (id: string) => {
    if (window.confirm('Xóa công ty này? Thao tác này có thể ảnh hưởng đến các nhân viên liên quan.')) {
      try {
        await deleteCompany(id);
        setCompanies(prev => prev.filter(c => c.id !== id));
        alert('Đã xóa đối tác thành công');
      } catch (error) {
        console.error(error);
        alert('Không thể xóa đối tác lúc này.');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HiOutlineOfficeBuilding className="text-pink-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Đối tác Công ty</h1>
          </div>
          <p className="text-gray-500">Danh sách các doanh nghiệp và tổ chức hợp tác.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Làm mới dữ liệu"
          >
            <HiOutlineRefresh size={22} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => navigate('/users/companies/add')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-pink-500/20 active:scale-95"
          >
            <HiOutlinePlus size={20} />
            Thêm Mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Đang tải danh sách công ty...</p>
          </div>
        ) : (
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Thông tin Công Ty</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    {/* 👇 ĐÃ SỬA: Thay Ngày tạo bằng Số điện thoại */}
                    <th className="px-6 py-4">Số điện thoại</th>
                    <th className="px-6 py-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {companies.length > 0 ? companies.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50/30 transition-colors">
                      {/* Cột 1: Thông tin chung */}
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <p className="font-bold text-gray-900 text-base">{c.fullName}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded font-mono">
                                        @{c.username}
                                    </span>
                                    <span className="text-[10px] text-blue-500 font-bold uppercase">
                                        {c.role}
                                    </span>
                                </div>
                            </div>
                        </div>
                      </td>
                      
                      {/* Cột 2: Email */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                            <p className="text-gray-700 font-medium">{c.email}</p>
                        </div>
                      </td>

                      {/* Cột 3: Trạng thái */}
                      <td className="px-6 py-4">
                        {c.active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[11px] font-bold border border-green-100">
                                <HiOutlineCheckCircle /> Hoạt động
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-bold border border-red-100">
                                <HiOutlineBan /> Đã khóa
                            </span>
                        )}
                      </td>

                      {/* 👇 Cột 4: SỐ ĐIỆN THOẠI (ĐÃ SỬA) */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <HiOutlinePhone className="text-gray-400 shrink-0"/>
                            {c.phone ? (
                                <span className="font-mono text-gray-700 font-medium tracking-wide">
                                    {c.phone}
                                </span>
                            ) : (
                                <span className="text-gray-300 italic text-xs">---</span>
                            )}
                         </div>
                      </td>

                      {/* Cột 5: Thao tác */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => navigate(`/users/companies/edit/${c.id}`)} 
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <HiOutlinePencil size={20} />
                          </button>
                          <button 
                            onClick={() => c.id && handleDeleteCompany(c.id)} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Xóa công ty"
                          >
                            <HiOutlineTrash size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 italic">
                        Chưa có công ty đối tác nào trong danh sách.
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

export default CompanyManagement; 