import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, Loader2, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// BỔ SUNG: Import các hàm API và Interface từ file api_article.ts
import { 
    getAllArticles, 
    deleteArticle, 
    Article, 
    ArticleStatus 
} from '../apis/api_article';
// BỔ SUNG: Import getImageUrl từ file api_image.ts
import { getImageUrl } from '../apis/api_image'; 

// =================================================================
// COMPONENT CHÍNH: AdminNews
// =================================================================

const AdminNews: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // --- Logic Fetch Dữ liệu (Giữ nguyên) ---
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (err) {
      setError('Không thể tải dữ liệu từ Server. Vui lòng kiểm tra console.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // --- Hàm Xử lý (Giữ nguyên) ---

  const handleAddNewArticle = () => {
    navigate('/admin/news/add');
  };

  const handleEditArticle = (id: string) => { 
    navigate(`/admin/news/edit/${id}`);
  };

  const handleDeleteArticle = async (id: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết ID: ${id}?`)) {
      try {
        await deleteArticle(id);
        alert('Đã xóa bài viết thành công!');
        fetchArticles();
      } catch (err) {
        alert('Lỗi khi xóa bài viết. Vui lòng thử lại.');
        console.error('Delete Error:', err);
      }
    }
  };
  
  // --- Lọc Dữ liệu (Giữ nguyên) ---
  const filteredArticles = articles
    .filter(article => 
      (statusFilter === 'ALL' || article.status === statusFilter)
    )
    .filter(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // --- JSX Render Helpers (Giữ nguyên) ---
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString.substring(0, 10);
    }
  };
  
  const getStatusDisplay = (status: ArticleStatus) => {
      switch (status) {
          case 'PUBLISHED': return { text: 'Published', style: 'bg-green-100 text-green-700' };
          case 'DRAFT': return { text: 'Draft', style: 'bg-gray-100 text-gray-700' };
          case 'PENDING': return { text: 'Pending', style: 'bg-yellow-100 text-yellow-700' };
      }
  };

  // --- JSX Render ---

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">News Management</h2>
           <p className="text-gray-500 text-sm">Create, edit and manage website news articles.</p>
        </div>
        <button 
            onClick={handleAddNewArticle}
            className="bg-brand-pink text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-pink-600 transition-colors shadow-sm"
        >
            <Plus className="w-5 h-5" />
            Add New Article
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
         {/* Filter Bar */}
         <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search news..." 
                    className="w-full pl-9 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-brand-pink text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
                className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-brand-pink text-sm bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="ALL">All Status</option>
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING">Pending</option>
            </select>
         </div>

         {/* Table Content */}
         <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Image</th>
                        <th className="px-6 py-4">Title</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500">
                                <Loader2 className="w-6 h-6 animate-spin inline-block mr-2" />
                                Đang tải dữ liệu...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-red-600">
                                Lỗi: {error}
                            </td>
                        </tr>
                    ) : filteredArticles.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500">
                                Không tìm thấy bài viết nào.
                            </td>
                        </tr>
                    ) : (
                        filteredArticles.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4"> {/* <--- CỘT IMAGE */}
                                    {item.thumbUrl ? (
                                        <img 
                                            // SỬ DỤNG getImageUrl VÀO ĐÂY
                                            src={item.thumbUrl}
                                            alt={item.title}
                                            className="w-16 h-10 object-cover rounded shadow-sm"
                                            // Tùy chọn: Xử lý lỗi ảnh
                                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/64x40?text=No+Image'; }}
                                        />
                                    ) : (
                                        <div className="w-16 h-10 bg-gray-200 flex items-center justify-center rounded">
                                            <Image className="w-4 h-4 text-gray-500" />
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-800 line-clamp-1">{item.title}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                                    {formatDate(item.publishedDate || item.createdDate)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusDisplay(item.status).style}`}>
                                        {getStatusDisplay(item.status).text}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    <button 
                                        onClick={() => item.id && handleEditArticle(item.id)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => item.id && handleDeleteArticle(item.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
         </div>
         
         <div className="p-4 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
            <span>Showing {filteredArticles.length} results (Total: {articles.length})</span>
            <div className="flex gap-1">
                <button className="px-2 py-1 border rounded hover:bg-gray-50">Prev</button>
                <button className="px-2 py-1 border rounded hover:bg-gray-50">Next</button>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AdminNews;