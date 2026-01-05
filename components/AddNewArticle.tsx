import React, { useState, useEffect } from 'react';
import { Save, Send, X, FileText, Settings, Tag, MessageSquare, Image, Upload, Loader2, Link as LinkIcon } from 'lucide-react';
// Thêm useParams để lấy ID từ URL
import { useNavigate, useParams } from 'react-router-dom';

// Import thư viện Draft.js
import { EditorState, convertToRaw, ContentState } from 'draft-js';
import { Editor } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

// Import API: Thêm getArticleById và updateArticle
import { createArticle, updateArticle, getArticleById, Article, ArticleStatus } from '../apis/api_article'; 
import { uploadImageFile, getImageUrl } from '../apis/api_image'; 

// =================================================================
// 1. UTILS & TYPES
// =================================================================

interface ArticleForm extends Omit<Article, 'status' | 'id' | 'createdAt'> {
    slug?: string;
}

const generateSlug = (str: string) => {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
};

const getEditorStateFromHtml = (html: string): EditorState => {
    if (html) {
        const blocksFromHtml = htmlToDraft(html);
        const { contentBlocks, entityMap } = blocksFromHtml;
        const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
        return EditorState.createWithContent(contentState);
    }
    return EditorState.createEmpty();
}

// =================================================================
// 2. SUB-COMPONENTS
// =================================================================

// Editor Component (Đã tối ưu để nhận value thay đổi từ cha)
const CustomRichTextEditor: React.FC<{ value: string; onChange: (content: string) => void }> = ({ value, onChange }) => {
    const [editorState, setEditorState] = useState(() => getEditorStateFromHtml(value));

    // Effect này quan trọng: Khi dữ liệu bài viết cũ được tải về, Editor cần update nội dung
    useEffect(() => {
        setEditorState(getEditorStateFromHtml(value));
    }, [value]);

    const onEditorStateChange = (newEditorState: EditorState) => {
        setEditorState(newEditorState);
        const contentHtml = draftToHtml(convertToRaw(newEditorState.getCurrentContent()));
        onChange(contentHtml);
    };
    
    const toolbarOptions = {
        options: ['history', 'inline', 'blockType', 'fontSize', 'fontFamily', 'list', 'textAlign', 'colorPicker', 'link', 'embedded', 'image', 'remove'],
        inline: { options: ['bold', 'italic', 'underline', 'strikethrough'], inDropdown: false },
        image: {
            uploadCallback: async (file: File) => {
                try {
                    const imageId = await uploadImageFile(file);
                    const imageUrl = getImageUrl(imageId);
                    return { data: { link: imageUrl } };
                } catch (error) {
                    console.error('Editor Upload Error:', error);
                    throw error;
                }
            },
            alt: { present: true, mandatory: false },
            previewImage: true,
        },
    };

    return (
        <div className="rounded-lg border border-gray-300 shadow-sm overflow-hidden">
            <Editor
                editorState={editorState}
                onEditorStateChange={onEditorStateChange}
                toolbar={toolbarOptions}
                wrapperClassName="wrapper-class"
                editorClassName="editor-class p-4 bg-white min-h-[300px]"
                toolbarClassName="toolbar-class bg-gray-50 border-b border-gray-200"
                placeholder="Nội dung bài viết chi tiết..."
            />
        </div>
    );
};

const ImageThumbUploader: React.FC<{ url: string; onChange: (url: string) => void }> = ({ url, onChange }) => {
    const [uploading, setUploading] = useState(false);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploading(true);
            try {
                const imageId = await uploadImageFile(file);
                const imageUrl = getImageUrl(imageId);
                onChange(imageUrl); 
            } catch (error) {
                alert('Lỗi tải ảnh lên.');
            } finally {
                setUploading(false);
            }
        }
    };
    
    const handleDelete = () => {
        if (window.confirm("Bạn muốn xóa ảnh này?")) onChange('');
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Image className="w-4 h-4" />
                Ảnh Đại Diện (Thumbnail)
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
                {uploading ? (
                     <div className="flex flex-col items-center justify-center h-24 text-brand-pink">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm mt-2">Đang tải lên...</span>
                    </div>
                ) : url ? (
                    <div className="relative group">
                        <img src={url} alt="Thumbnail" className="w-full h-auto object-cover rounded-lg mb-2 border border-gray-100" />
                        <button onClick={handleDelete} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">Chọn ảnh hoặc Kéo & Thả</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                )}
            </div>
        </div>
    );
};

const InputGroup: React.FC<{ 
    label: string; 
    name: keyof ArticleForm; 
    type?: string; 
    placeholder?: string; 
    maxLength?: number; 
    isTextArea?: boolean; 
    icon: React.ReactNode;
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
}> = ({ label, name, type = 'text', placeholder = '', maxLength, isTextArea = false, icon, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
            {icon}
            {label} 
            {maxLength && <span className="text-xs text-gray-400 ml-2">({value?.length || 0}/{maxLength})</span>}
        </label>
        {isTextArea ? (
            <textarea
                id={name}
                name={name}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-pink transition-colors text-sm"
                placeholder={placeholder}
                value={value} 
                onChange={onChange} 
                maxLength={maxLength}
            />
        ) : (
            <input
                type={type}
                id={name}
                name={name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-pink transition-colors text-sm"
                placeholder={placeholder}
                value={value} 
                onChange={onChange} 
                maxLength={maxLength}
            />
        )}
    </div>
);

// =================================================================
// 3. MAIN COMPONENT
// =================================================================

export const AddNewArticle: React.FC = () => {
  const navigate = useNavigate(); 
  const { id } = useParams<{ id: string }>(); // Lấy ID từ URL
  const isEditMode = !!id; // Kiểm tra xem đang ở chế độ sửa hay thêm

  const [status, setStatus] = useState<ArticleStatus>('DRAFT'); 
  const [loading, setLoading] = useState(false); 

  const [article, setArticle] = useState<ArticleForm>({ 
    title: '',
    slug: '', 
    shortDescription: '',
    content: '', 
    tags: '',
    seoTitle: '',
    seoDescription: '',
    thumbUrl: '',
  });

  // 🔥 EFFECT MỚI: Tải dữ liệu bài viết cũ nếu đang ở chế độ Sửa
  useEffect(() => {
    if (isEditMode && id) {
        const fetchArticleData = async () => {
            try {
                setLoading(true);
                const data = await getArticleById(id);
                setArticle({
                    title: data.title,
                    shortDescription: data.shortDescription,
                    content: data.content,
                    tags: data.tags,
                    seoTitle: data.seoTitle,
                    seoDescription: data.seoDescription,
                    thumbUrl: data.thumbUrl,
                    slug: data.slug
                });
                setStatus(data.status); // Set lại trạng thái cũ
            } catch (error) {
                console.error("Lỗi tải bài viết:", error);
                alert("Không tìm thấy bài viết hoặc lỗi kết nối.");
                navigate('/admin/news');
            } finally {
                setLoading(false);
            }
        };
        fetchArticleData();
    }
  }, [id, isEditMode, navigate]);
  
  const handleArticleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setArticle(prev => {
        const newState = { ...prev, [name]: value };
        if (name === 'title' && !isEditMode) { // Chỉ tự động tạo slug khi thêm mới
            newState.slug = generateSlug(value);
            if (!prev.seoTitle) newState.seoTitle = value;
        }
        return newState;
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setStatus(e.target.value as ArticleStatus);
  };
  
  const handleThumbUrlChange = (url: string) => {
    setArticle(prev => ({ ...prev, thumbUrl: url }));
  };

  const handleRichTextChange = (content: string) => {
    setArticle(prev => ({ ...prev, content }));
  };

  const handleSubmit = async (targetStatus: ArticleStatus) => {
    if (!article.title || !article.content) {
        alert('Vui lòng điền Tiêu đề và Nội dung bài viết.');
        return;
    }
    
    setLoading(true);
    
    const articleData: Article = {
        ...article,
        id: isEditMode && id ? parseInt(id) : 0, // ID cần cho update
        createdAt: new Date().toISOString(),
        status: targetStatus,
    };
    
    try {
        if (isEditMode && id) {
            // Logic CẬP NHẬT
            await updateArticle(id, articleData);
            alert(`Đã cập nhật bài viết thành công!`);
        } else {
            // Logic TẠO MỚI
            await createArticle(articleData); 
            alert(`Đã tạo bài viết mới thành công!`);
        }
        navigate('/admin/news'); 
    } catch (error) {
        alert('Lỗi khi lưu dữ liệu.');
        console.error('API Error:', error);
    } finally {
        setLoading(false);
    }
  };

  // 🔥 SỬA LỖI: Thêm setTimeout để fix lỗi 'Can't call setState'
  const handleCancel = () => {
    if (window.confirm("Bạn có chắc chắn muốn hủy bỏ? Mọi thay đổi sẽ bị mất.")) {
        setTimeout(() => {
            navigate('/admin/news'); 
        }, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">
               {isEditMode ? 'Chỉnh Sửa Bài Viết' : 'Thêm Bài Viết Mới'}
           </h2>
           <p className="text-gray-500 text-sm">Điền thông tin chi tiết và nội dung cho bài viết tin tức mới.</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={handleCancel}
                disabled={loading}
                className="text-gray-600 px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-200 transition-colors shadow-sm border border-gray-300 disabled:opacity-50"
            >
                <X className="w-5 h-5" />
                Hủy Bỏ
            </button>
            <button 
                onClick={() => handleSubmit('DRAFT')}
                disabled={loading}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-gray-600 transition-colors shadow-sm disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Lưu Nháp
            </button>
            <button 
                onClick={() => handleSubmit('PUBLISHED')}
                disabled={loading}
                // Sửa: text-black -> text-white để nổi trên nền hồng
                className="bg-brand-pink text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 bg-pink-600 transition-colors shadow-sm disabled:opacity-50"
            >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />} Xuất Bản
            </button>
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-3 mb-4">
                    <FileText className="w-5 h-5 text-brand-pink" />
                    Thông Tin Cơ Bản
                </h3>
                
                <InputGroup 
                    label="Tiêu Đề Bài Viết" 
                    name="title" 
                    placeholder="Nhập tiêu đề hấp dẫn cho bài viết..." 
                    icon={<FileText className="w-4 h-4" />}
                    value={article.title}
                    onChange={handleArticleChange}
                />

                <InputGroup 
                    label="Mô Tả Ngắn" 
                    name="shortDescription" 
                    isTextArea={true}
                    maxLength={250}
                    placeholder="Tóm tắt nội dung chính (max 250 ký tự)..." 
                    icon={<MessageSquare className="w-4 h-4" />}
                    value={article.shortDescription}
                    onChange={handleArticleChange}
                />
            </div>

            {/* Content Editor Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-3 mb-4">
                    <FileText className="w-5 h-5 text-brand-pink" />
                    Nội Dung Bài Viết
                </h3>
                
                <CustomRichTextEditor 
                    value={article.content} 
                    onChange={handleRichTextChange} 
                />
            </div>

        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
           
            {/* Featured Image Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-3 mb-4">
                    <Image className="w-5 h-5 text-brand-pink" />
                    Ảnh Đại Diện
                </h3>
                <ImageThumbUploader 
                    url={article.thumbUrl}
                    onChange={handleThumbUrlChange}
                />
            </div>
            
            {/* Tags & Meta Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-3 mb-4">
                    <Tag className="w-5 h-5 text-brand-pink" />
                    Phân Loại & Trạng Thái
                </h3>
                
                <InputGroup 
                    label="Thẻ (Tags)" 
                    name="tags" 
                    placeholder="VD: công nghệ, tin tức..." 
                    icon={<Tag className="w-4 h-4" />}
                    value={article.tags}
                    onChange={handleArticleChange}
                />
                
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                        <Save className="w-4 h-4" />
                        Trạng Thái
                    </label>
                    <select 
                        id="status" 
                        name="status"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-brand-pink transition-colors text-sm bg-white"
                        value={status} 
                        onChange={handleStatusChange}
                    >
                        <option value="PUBLISHED">Xuất Bản (Published)</option>
                        <option value="DRAFT">Bản Nháp (Draft)</option>
                        <option value="PENDING">Chờ Duyệt (Pending)</option>
                    </select>
                </div>
            </div>
            
            {/* SEO Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 border-b pb-3 mb-4">
                    <Settings className="w-5 h-5 text-brand-pink" />
                    Cấu Hình SEO
                </h3>

                <InputGroup 
                    label="Đường dẫn tĩnh (Slug)" 
                    name="slug" 
                    placeholder="bai-viet-moi-nhat" 
                    icon={<LinkIcon className="w-4 h-4" />}
                    value={article.slug || ''}
                    onChange={handleArticleChange}
                />

                <InputGroup 
                    label="Tiêu Đề SEO" 
                    name="seoTitle" 
                    maxLength={60}
                    placeholder="Tiêu đề hiển thị Google..." 
                    icon={<FileText className="w-4 h-4" />}
                    value={article.seoTitle}
                    onChange={handleArticleChange}
                />

                <InputGroup 
                    label="Mô Tả SEO" 
                    name="seoDescription" 
                    isTextArea={true}
                    maxLength={160}
                    placeholder="Mô tả Google..." 
                    icon={<MessageSquare className="w-4 h-4" />}
                    value={article.seoDescription}
                    onChange={handleArticleChange}
                />

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mt-2">
                    <p className="text-blue-700 text-sm font-medium truncate mb-0.5 hover:underline cursor-pointer">
                        {article.seoTitle || article.title || 'Tiêu đề bài viết sẽ hiện ở đây...'}
                    </p>
                    <p className="text-green-700 text-xs mb-1">
                        https://website.com/news/{article.slug || 'duong-dan-bai-viet'}
                    </p>
                    <p className="text-gray-600 text-xs line-clamp-2">
                        {article.seoDescription || article.shortDescription || 'Mô tả bài viết sẽ hiển thị ở đây trên kết quả tìm kiếm...'}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AddNewArticle;