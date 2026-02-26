import React, { useEffect, useState } from 'react';
import axiosClient from '@/axiosclient';
import hotelApi from '@/apis/hotelApi';
import { 
  Plus, 
  Search, 
  ChefHat, 
  Utensils, 
  Tag, 
  Layers, 
  Package, 
  Loader2, 
  AlertTriangle, 
  ChevronDown,
  Image as ImageIcon
} from 'lucide-react';
import { toast } from 'react-toastify';

// --- Interfaces ---
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  category?: string;
}

const HotelMenuPage: React.FC = () => {
  // --- States ---
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [hotels, setHotels] = useState<{ id: string, name: string }[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newService, setNewService] = useState({ 
    name: '', 
    price: 0, 
    unit: '', 
    description: '', 
    category: '' 
  });

  // --- Logic 1: Lấy danh sách khách sạn ---
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await hotelApi.getAll({ page: 0, size: 100 });
        const hotelList = res.data?.content || [];
        setHotels(hotelList);
        
        if (hotelList.length > 0) {
          setSelectedHotelId(hotelList[0].id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Lỗi lấy danh sách khách sạn:", err);
        setError("Không thể kết nối với danh sách khách sạn");
        setLoading(false);
      }
    };
    fetchHotels();
  }, []);

  // --- Logic 2: Lấy thực đơn của khách sạn đã chọn ---
  useEffect(() => {
    if (!selectedHotelId) return;

    const fetchMenu = async () => {
      try {
        setLoading(true);
        const response = await axiosClient.get(`/hotel-services/menu/${selectedHotelId}`);
        const rawData = response.data || response;
        const items = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || []);
        
        setMenuItems(items);
        setError(null);
      } catch (err: any) {
        console.error("Lỗi tải thực đơn:", err);
        setError(err.response?.data?.message || 'Không thể tải thực đơn lúc này');
        setMenuItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedHotelId]);

  // --- Logic 3: Thêm món mới ---
  const handleCreateService = async () => {
    if (!selectedHotelId) {
      toast.warning('Vui lòng chọn khách sạn trước!');
      return;
    }
    if (!newService.name || newService.price <= 0) {
      toast.warning('Vui lòng nhập tên và giá hợp lệ!');
      return;
    }

    setIsAdding(true);
    try {
      const payload = { 
        hotelId: selectedHotelId, 
        ...newService, 
        price: Number(newService.price) 
      };
      const res: any = await axiosClient.post('/hotel-services/menu', payload);

      const createdItem = res.data?.data || res.data;
      const newItem: MenuItem = {
        id: createdItem?.id || 'new-' + Date.now(),
        name: newService.name,
        description: newService.description,
        price: Number(newService.price),
        category: newService.category,
      };

      setMenuItems(prev => [newItem, ...prev]);
      toast.success('Thêm món thành công!');
      setNewService({ name: '', price: 0, unit: '', description: '', category: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi lưu món mới');
    } finally {
      setIsAdding(false);
    }
  };

// Sửa lại hàm formatCurrency trong code của bạn
const formatCurrency = (amount: number) => {
  if (amount === undefined || amount === null) return '0 ₫';
  
  // Sử dụng toLocaleString('vi-VN') để giữ nguyên giá trị số 
  // và thêm đơn vị "₫" thủ công để tránh format tiền tệ tự động làm tròn lẻ
  return amount.toLocaleString('vi-VN') + ' ₫';
};

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      
      {/* HEADER / BANNER */}
      <div className="bg-slate-900 text-white pt-16 pb-28 px-4 text-center relative overflow-hidden">
        {/* Họa tiết trang trí ẩn dưới nền */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-wrap gap-12 justify-center items-center">
            {Array(10).fill(0).map((_, i) => <Utensils key={i} size={80} />)}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 uppercase italic">
            Dịch Vụ & Thực Đơn
          </h1>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-4 py-1.5 rounded-full border border-rose-500/30 text-sm font-semibold mb-4 animate-pulse">
            <AlertTriangle size={16} />
            CHỨC NĂNG ĐANG PHÁT TRIỂN
          </div>
          <p className="text-slate-400 text-lg font-medium">Quản lý các mặt hàng dịch vụ dành cho khách lưu trú</p>
        </div>
      </div>

      {/* THANH CHỌN KHÁCH SẠN (Đặt dưới Banner để tránh lỗi che khuất Dropdown) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-50">
        <div className="bg-white p-2 md:p-4 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl shrink-0 shadow-lg shadow-blue-200">
            <Search size={18} />
            <span className="text-sm font-bold uppercase tracking-widest">Cơ sở:</span>
          </div>
          
          <div className="relative w-full">
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="w-full pl-6 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[1.5rem] outline-none transition-all font-bold text-slate-700 appearance-none cursor-pointer text-lg"
              disabled={hotels.length === 0}
            >
              {hotels.length === 0 ? (
                <option value="">Đang tải danh sách cơ sở...</option>
              ) : (
                hotels.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
                ))
              )}
            </select>
            <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={24} />
          </div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* CỘT TRÁI: FORM THÊM MÓN MỚI */}
          <div className="lg:col-span-4">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 sticky top-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                  <Plus size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Thêm món</h2>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tên mặt hàng</label>
                  <input 
                    placeholder="vd: Coca Cola, Pizza..." 
                    value={newService.name}
                    onChange={e => setNewService({ ...newService, name: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner font-semibold" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Giá (VNĐ)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={newService.price || ''}
                      onChange={e => setNewService({ ...newService, price: Number(e.target.value) })}
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner font-bold text-blue-600" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Đơn vị</label>
                    <input 
                      placeholder="vd: Lon, Cái" 
                      value={newService.unit}
                      onChange={e => setNewService({ ...newService, unit: e.target.value })}
                      className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phân loại</label>
                  <input 
                    placeholder="vd: Đồ uống, Khai vị" 
                    value={newService.category}
                    onChange={e => setNewService({ ...newService, category: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner" 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Mô tả ngắn</label>
                  <textarea 
                    placeholder="Thành phần hoặc lưu ý..." 
                    rows={3}
                    value={newService.description}
                    onChange={e => setNewService({ ...newService, description: e.target.value })}
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner resize-none" 
                  />
                </div>

                <button
                  onClick={handleCreateService}
                  disabled={isAdding || !selectedHotelId}
                  className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-xl hover:bg-blue-600 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:bg-slate-300 disabled:shadow-none mt-4"
                >
                  {isAdding ? <Loader2 className="animate-spin" /> : <Package size={22} />}
                  XÁC NHẬN LƯU
                </button>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: GRID DANH SÁCH MÓN ĂN */}
          <div className="lg:col-span-8">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white h-72 rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />
                ))}
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-100 p-12 rounded-[3rem] text-center">
                <AlertTriangle size={48} className="mx-auto text-rose-500 mb-4" />
                <h3 className="text-xl font-black text-rose-800">Lỗi dữ liệu</h3>
                <p className="text-rose-600/70 mt-2 font-medium">{error}</p>
              </div>
            ) : menuItems.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 p-20 rounded-[3rem] text-center shadow-inner">
                <ChefHat size={64} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-2xl font-black text-slate-400">Thực đơn còn trống</h3>
                <p className="text-slate-400/70 mt-2">Vui lòng thêm món ăn đầu tiên cho cơ sở này.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {menuItems.map((item) => (
                  <div key={item.id} className="group bg-white rounded-[2.5rem] p-5 shadow-xl shadow-slate-200/40 border border-slate-100 hover:border-blue-300 hover:shadow-blue-100 transition-all duration-500">
                    {/* Image Area */}
                    <div className="relative h-56 w-full rounded-[2rem] overflow-hidden mb-6 shadow-md">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop'}
                        alt={item.name}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Food+Image';
                        }}
                      />
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-5 py-2 rounded-2xl text-xl font-black text-blue-700 shadow-2xl">
                        {formatCurrency(item.price)}
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="px-2">
                      <div className="flex items-center gap-2 mb-3">
                        {item.category && (
                          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                            <Tag size={10} /> {item.category}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black tracking-widest rounded-full">
                           ID: {item.id.toString().substring(0, 6)}
                        </span>
                      </div>

                      <h3 className="text-2xl font-black text-slate-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {item.name}
                      </h3>
                      
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-6 min-h-[40px]">
                        {item.description || "Chưa có mô tả chi tiết cho món ăn này từ khách sạn."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-tighter">
                          <Utensils size={14} />
                          <span>Món ăn sẵn sàng</span>
                        </div>
                        <button 
                          className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg active:scale-90"
                          onClick={() => console.log(`Action for item: ${item.id}`)}
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default HotelMenuPage;