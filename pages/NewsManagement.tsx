import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash, HiOutlineSearch, HiOutlinePhotograph, HiOutlineRefresh } from 'react-icons/hi';
// IMPORT API THẬT
import { getAllArticles, deleteArticle, Article } from '../apis/api_article';

const NewsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Hàm tải dữ liệu từ API
  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await getAllArticles();
      setNews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải tin tức:', error);
      alert('Không thể kết nối với máy chủ tin tức.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // Logic Xóa tin tức
  const handleDeleteNews = async (id: string | undefined) => {
    if (!id) return;
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này? Hành động này sẽ cập nhật ngay lập tức lên Web Client.')) {
      try {
        await deleteArticle(id);
        setNews(prev => prev.filter(item => item.id !== id));
        alert('Đã xóa bài viết thành công!');
      } catch (error) {
        alert('Lỗi khi xóa bài viết.');
      }
    }
  };

  // Lọc theo tìm kiếm
  const filteredNews = news.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Tin tức</h1>
          <p className="text-sm text-gray-500">Nội dung hiển thị tại mục Tin tức trên Web Client</p>
        </div>
        <button 
          onClick={() => navigate('/news/add')}
          className="bg-pink-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-pink-200 transition-all"
        >
          <HiOutlinePlus size={20} /> Viết bài mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Thanh tìm kiếm */}
        <div className="p-4 border-b border-gray-50 flex gap-4">
            <div className="relative flex-1">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm tiêu đề bài viết..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-pink-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button onClick={fetchNews} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"><HiOutlineRefresh size={20}/></button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Hình ảnh</th>
                <th className="px-6 py-4">Tiêu đề & Trạng thái</th>
                <th className="px-6 py-4">Menu hiển thị</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan={4} className="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : filteredNews.length > 0 ? filteredNews.map((item) => (
                <tr key={item.id} className="group hover:bg-pink-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-20 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200">
                      {item.thumbUrl ? (
                        <img src={item.thumbUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><HiOutlinePhotograph /></div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.status === 'PUBLISHED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{item.menu || 'Chưa phân loại'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/news/edit/${item.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><HiOutlinePencil size={18} /></button>
                      <button onClick={() => handleDeleteNews(item.id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><HiOutlineTrash size={18} /></button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="text-center py-20 text-gray-400 italic">Không có dữ liệu tin tức.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NewsManagement;