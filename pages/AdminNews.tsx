import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Edit, Search, Loader2, Image,
  LayoutGrid, List, Calendar, ArrowUpRight, BarChart3, Filter, X, ChevronRight, Hash,
  Clock, Eye, MessageSquare, Tags,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getAllArticles,
  deleteArticle,
  Article,
  ArticleStatus
} from '../apis/api_article';
import { getImageUrl } from '../apis/api_image';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';


// =================================================================
// CUSTOM ANIMATIONS
// =================================================================
const AnimationStyles = () => (
  <style>{`
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .animate-in { animation-fill-mode: both; }
    .fade-in { animation-name: fadeIn; }
    .zoom-in { animation-name: zoomIn; }
    .slide-in-from-bottom-4 { animation-name: slideInUp; }
    .duration-300 { animation-duration: 300ms; }
    .duration-500 { animation-duration: 500ms; }
    .duration-700 { animation-duration: 700ms; }
  `}</style>
);

// =================================================================
// SUB-COMPONENT: StatusBadge
// =================================================================
const StatusBadge: React.FC<{ status: ArticleStatus }> = ({ status }) => {
  const config = {
    PUBLISHED: { text: 'Published', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    DRAFT: { text: 'Draft', classes: 'bg-slate-100 text-slate-600 border-slate-200' },
    PENDING: { text: 'Pending', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  };

  const { text, classes } = config[status] || config.DRAFT;

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${classes} uppercase tracking-wider`}>
      {text}
    </span>
  );
};

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // --- Logic Fetch Dữ liệu ---
  const fetchArticles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllArticles();
      setArticles(data);
    } catch (err: any) {
      console.error("Fetch Articles Error:", err);
      // Lấy thông báo lỗi chi tiết để hiển thị
      const msg = err?.response?.data?.message || err?.message || 'Không thể tải dữ liệu từ Server.';
      setError(`${msg} (Check Console for details)`);
      toast.error(`Lỗi: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  // --- Tính toán Stats ---
  const stats = useMemo(() => {
    const safeArticles = Array.isArray(articles) ? articles : [];
    return {
      total: safeArticles.length,
      published: safeArticles.filter(a => a.status === 'PUBLISHED').length,
      draft: safeArticles.filter(a => a.status === 'DRAFT').length,
      pending: safeArticles.filter(a => a.status === 'PENDING').length,
    };
  }, [articles]);

  // --- Lọc Dữ liệu ---
  const filteredArticles = useMemo(() => {
    const safeArticles = Array.isArray(articles) ? articles : [];
    return safeArticles
      .filter(article => (statusFilter === 'ALL' || article.status === statusFilter))
      .filter(article => article.title.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [articles, statusFilter, searchTerm]);

  // --- Hàm Xử lý ---
  const handleAddNewArticle = () => navigate('/news/add');
  const handleEditArticle = (id: string) => navigate(`/news/edit/${id}`);

  const handleDeleteArticle = async (id: string) => {
    const result = await Swal.fire({
      title: "Xóa bài viết?",
      text: "Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      await deleteArticle(id);
      toast.success("Đã xóa bài viết thành công!");
      fetchArticles();
    } catch (err) {
      toast.error("Lỗi khi xóa bài viết.");
      console.error("Delete Error:", err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString.substring(0, 10);
    }
  };

  // --- JSX Render Sections ---

  const renderStats = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: 'Total Articles', value: stats.total, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Published', value: stats.published, icon: Eye, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Drafts', value: stats.draft, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' }
      ].map((item, i) => (
        <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-transform hover:scale-[1.02]">
          <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}>
            <item.icon className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider">{item.label}</p>
            <h4 className="text-xl md:text-2xl font-bold text-gray-800">{item.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );

  const renderFilterBar = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-end md:items-center justify-between">
      <div className="flex flex-wrap items-center gap-1 md:gap-2 bg-gray-100 p-1 rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
        {['ALL', 'PUBLISHED', 'PENDING', 'DRAFT'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`flex-1 sm:flex-none whitespace-nowrap px-3 md:px-4 py-1.5 rounded-lg text-[12px] md:text-sm font-semibold transition-all ${statusFilter === status
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative flex-1 md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search news..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-pink-500 transition-all text-sm bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400'}`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-400'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredArticles.map((item) => (
        <div
          key={item.id}
          className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full active:scale-[0.98]"
        >
          {/* Image Container */}
          <div className="relative h-48 overflow-hidden bg-gray-50">
            {item.thumbUrl ? (
              <img
                src={item.thumbUrl}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <Image className="w-10 h-10 mb-2 opacity-20" />
                <span className="text-xs">No Thumbnail</span>
              </div>
            )}
            <div className="absolute top-3 right-3">
              <StatusBadge status={item.status} />
            </div>
            {/* Hover Actions Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={() => item.id && handleEditArticle(item.id.toString())}
                className="p-3 bg-white text-blue-600 rounded-full hover:bg-blue-50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
              >
                <Edit className="w-5 h-5" />
              </button>
              <button
                onClick={() => item.id && handleDeleteArticle(item.id.toString())}
                className="p-3 bg-white text-red-600 rounded-full hover:bg-red-50 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold text-gray-500 rounded flex items-center gap-1 uppercase tracking-wider">
                <Hash className="w-3 h-3" />
                {item.menu || 'General'}
              </span>
              <span className="text-[10px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(item.publishedDate || item.createdDate)}
              </span>
            </div>
            <h3 className="font-bold text-gray-800 leading-tight line-clamp-2 group-hover:text-pink-600 transition-colors mb-2">
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
              {item.shortDescription || 'No description available for this article.'}
            </p>

            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <div className="flex gap-2">
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Tags className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">{item.tags || 'No tags'}</span>
                </div>
              </div>
              <button
                onClick={() => item.id && handleEditArticle(item.id.toString())}
                className="text-pink-600 text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
              >
                Edit Details <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTableView = () => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase tracking-[0.1em]">
            <tr>
              <th className="px-6 py-4">Article</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Menu</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredArticles.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.thumbUrl ? (
                        <img src={item.thumbUrl} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Image className="w-4 h-4 text-gray-300" /></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-gray-800 text-sm line-clamp-1">{item.title}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{item.shortDescription}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.menu || 'General'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs text-gray-500">{formatDate(item.publishedDate || item.createdDate)}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => item.id && handleEditArticle(item.id.toString())}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => item.id && handleDeleteArticle(item.id.toString())}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen pb-12 animate-in fade-in duration-500">
      <AnimationStyles />
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            News Hub
            <span className="px-2 py-1 bg-pink-100 text-pink-600 text-[10px] font-black uppercase rounded-md tracking-tighter">Admin</span>
          </h1>
          <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm md:text-base">
            Manage your content.
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className="text-gray-400 font-medium">{stats.total} total</span>
          </p>
        </div>
        <button
          onClick={handleAddNewArticle}
          className="w-full lg:w-auto bg-gray-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-pink-600 transition-all shadow-lg hover:shadow-pink-200 active:scale-95 group"
        >
          <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
            <Plus className="w-5 h-5" />
          </div>
          Create New Article
        </button>
      </div>

      {renderStats()}

      {renderFilterBar()}

      {/* Main Content */}
      <div className="relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center animate-in zoom-in duration-300">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-pink-100 border-t-pink-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-pink-500 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <p className="text-gray-400 font-bold mt-4 tracking-widest text-[10px] uppercase">Loading Content...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-12 rounded-3xl text-center max-w-lg mx-auto mt-12">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-red-600 text-sm mb-6">{error}</p>
            <button onClick={fetchArticles} className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors">
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <Search className="w-10 h-10 text-gray-200" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No articles found</h3>
            <p className="text-gray-500 max-w-sm mb-8">
              We couldn't find any articles matching your search or filter. Try adjusting your settings.
            </p>
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-pink-600 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-700">
            {viewMode === 'grid' ? renderGridView() : renderTableView()}
          </div>
        )}
      </div>

      {/* Footer / Pagination Mockup */}
      {!loading && filteredArticles.length > 0 && (
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">
            Displaying <span className="text-gray-900">{filteredArticles.length}</span> of <span className="text-gray-900">{articles.length}</span> news articles
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30" disabled>PREVIOUS</button>
            <div className="flex gap-1">
              <button className="w-8 h-8 rounded-lg bg-pink-600 text-white text-xs font-bold">1</button>
              <button className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors">2</button>
            </div>
            <button className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-pink-600 transition-colors flex items-center gap-1">
              NEXT <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNews;