import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  HiOutlineArrowLeft, 
  HiOutlineTicket, 
  HiOutlineOfficeBuilding, 
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineUser
} from 'react-icons/hi';
import axios from 'axios'; 

// --- 1. ĐỊNH NGHĨA TYPE DỰA TRÊN JSON BẠN GỬI ---

interface CustomerInfo {
    id: string;
    name: string;
    email: string;
    phone: string;
    membershipLevel: string | null;
    totalSpent: number;
    createdAt: string;
    updatedAt: string;
}

interface BookingItem {
    id: string;
    requestId?: string;
    showId?: string;
    showName?: string;      // Tên show (cho vé)
    hotelName?: string;     // Tên khách sạn (cho phòng - giả định)
    totalAmount: number;
    status: string;
    createdAt: string;
    // Field tự thêm ở Frontend để phân loại
    type: 'TICKET' | 'ROOM'; 
}

interface ApiHistoryResponse {
    success: boolean;
    message: string;
    data: {
        customerInfo: CustomerInfo;
        showBookings: Omit<BookingItem, 'type'>[];
        hotelBookings: Omit<BookingItem, 'type'>[];
    };
}

const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [history, setHistory] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tickets' | 'rooms'>('tickets');

  // --- 2. GỌI API ---
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('jwtToken');
        
        // URL API thực tế
        const url = `https://api.momangshow.vn/api/customers/${id}/history`;
        
        const response = await axios.get<ApiHistoryResponse>(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const result = response.data;

        if (result.success && result.data) {
            // 1. Set thông tin khách hàng
            setCustomer(result.data.customerInfo);

            // 2. Gộp danh sách Booking và đánh dấu loại
            const showList = result.data.showBookings.map(item => ({
                ...item,
                type: 'TICKET' as const
            }));

            const hotelList = result.data.hotelBookings.map(item => ({
                ...item,
                type: 'ROOM' as const
            }));

            // Gộp lại thành 1 mảng history chung để dễ quản lý
            setHistory([...showList, ...hotelList]);
        }

      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- HELPERS ---
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '---';
    return new Date(dateStr).toLocaleDateString('vi-VN', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusStyle = (status: string = '') => {
    const s = status ? status.toUpperCase() : '';
    switch (s) {
        case 'CONFIRMED':
        case 'PAID': 
        case 'SUCCESS': return 'bg-green-100 text-green-700 border-green-200';
        case 'PENDING': 
        case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        case 'CANCELLED': 
        case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Lọc dữ liệu hiển thị theo Tab
  const filteredData = history.filter(item => 
      activeTab === 'tickets' ? item.type === 'TICKET' : item.type === 'ROOM'
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"/>
        <p className="text-gray-500">Đang tải dữ liệu từ Server...</p>
      </div>
    );
  }

  if (!customer) return <div className="text-center py-20">Không tìm thấy thông tin khách hàng.</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
        <button 
            onClick={() => navigate('/users/customers')} 
            className="group flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
        >
          <HiOutlineArrowLeft size={20} className="text-gray-500 group-hover:text-gray-700 transition-colors" />
          <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">Quay lại danh sách</span>
        </button>

        <div className="pl-2 border-l border-gray-200">
           <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
             <HiOutlineUser className="text-pink-500" />
             Hồ sơ khách hàng
           </h1>
           <p className="text-sm text-gray-500 font-mono">ID: {customer.id}</p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 rounded-bl-[4rem] -mr-8 -mt-8" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white text-3xl font-bold">
                {customer.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* Info Detail */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">{customer.name}</h2>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200">
                        {customer.membershipLevel || 'Thành viên'}
                    </span>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><HiOutlineMail size={18} /></div>
                        <span className="font-medium">{customer.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                         <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><HiOutlinePhone size={18} /></div>
                        <span className="font-mono font-medium">{customer.phone}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                         <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><HiOutlineCalendar size={18} /></div>
                        <span className="text-sm">Ngày tham gia: {formatDate(customer.createdAt)}</span>
                    </div>
                     <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500"><HiOutlineCurrencyDollar size={18} /></div>
                        <span className="font-bold text-emerald-700 text-lg">{formatCurrency(customer.totalSpent)}</span>
                        <span className="text-xs text-gray-400 uppercase font-bold mt-1">Tổng chi tiêu</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm min-h-[400px]">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100">
              <button onClick={() => setActiveTab('tickets')} className={`flex-1 py-4 font-bold text-sm uppercase transition-colors ${activeTab === 'tickets' ? 'text-pink-600 border-b-2 border-pink-500 bg-pink-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  Lịch sử Vé Show ({history.filter(h => h.type === 'TICKET').length})
              </button>
              <button onClick={() => setActiveTab('rooms')} className={`flex-1 py-4 font-bold text-sm uppercase transition-colors ${activeTab === 'rooms' ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  Lịch sử Khách sạn ({history.filter(h => h.type === 'ROOM').length})
              </button>
          </div>

          <div className="p-0 overflow-x-auto">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-400 tracking-wider">
                      <tr>
                          <th className="px-6 py-4">Mã Giao Dịch</th>
                          <th className="px-6 py-4">{activeTab === 'tickets' ? 'Sự kiện / Vé' : 'Khách sạn / Phòng'}</th>
                          <th className="px-6 py-4">Ngày tạo</th>
                          <th className="px-6 py-4">Tổng tiền</th>
                          <th className="px-6 py-4 text-right">Trạng thái</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                     {filteredData.length > 0 ? filteredData.map((item) => (
                         <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                             <td className="px-6 py-4">
                                 <span className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                                     #{item.id.slice(-6).toUpperCase()}
                                 </span>
                                 {item.requestId && (
                                     <p className="text-[10px] text-gray-400 mt-1 font-mono">Req: {item.requestId.slice(0,8)}...</p>
                                 )}
                             </td>
                             <td className="px-6 py-4">
                                 <p className="font-bold text-gray-900 line-clamp-1">
                                    {item.showName || item.hotelName || (activeTab === 'tickets' ? 'Vé sự kiện' : 'Đặt phòng')}
                                 </p>
                             </td>
                             <td className="px-6 py-4 text-sm text-gray-600">
                                 {formatDate(item.createdAt)}
                             </td>
                             <td className="px-6 py-4 font-bold text-gray-900">
                                 {formatCurrency(item.totalAmount)}
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${getStatusStyle(item.status)}`}>
                                     {item.status}
                                 </span>
                             </td>
                         </tr>
                     )) : (
                         <tr><td colSpan={5} className="py-12 text-center text-gray-400 italic">Không có dữ liệu lịch sử</td></tr>
                     )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default CustomerDetail;