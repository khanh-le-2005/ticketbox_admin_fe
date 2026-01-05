



import axios, { AxiosResponse } from 'axios';
import { BASE_API_URL } from './api_base';

// =================================================================
// 1. INTERFACE/TYPES (BỔ SUNG TRƯỜNG MENU)
// =================================================================

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'PENDING';

export interface Article {
  id?: string;
  title: string;
  shortDescription: string;
  content: string; 
  tags: string;
  thumbUrl: string;
  menu?: string; // BỔ SUNG TRƯỜNG MENU
  seoTitle: string;
  seoDescription: string;
  status: ArticleStatus;
  createdDate?: string;
  publishedDate?: string;
}


// =================================================================
// 2. CẤU HÌNH API
// =================================================================

const API_ADMIN_BASE_URL = `${BASE_API_URL}/admin/news`; 

// Axios instance cho Admin
const adminApi = axios.create({
  baseURL: API_ADMIN_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Axios instance cho Public (không cần Auth)
const publicApi = axios.create({
    baseURL: API_ADMIN_BASE_URL,
});


// =================================================================
// 3. CÁC HÀM GỌI API (ADMIN) - Giữ nguyên
// =================================================================

/**
 * Lấy danh sách tất cả bài viết (dùng cho trang AdminNews)
 * GET /api/admin/news
 */
export const getAllArticles = async (): Promise<Article[]> => {
  try {
    const response: AxiosResponse<Article[]> = await adminApi.get('');
    return response.data;
  } catch (error) {
    console.error('Error fetching all articles:', error);
    throw error;
  }
};

// ... (getArticleById, createArticle, updateArticle, deleteArticle giữ nguyên) ...

export const getArticleById = async (id: string): Promise<Article> => {
  try {
    const response: AxiosResponse<Article> = await adminApi.get(`/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching article with ID ${id}:`, error);
    throw error;
  }
};

export const createArticle = async (articleData: Article): Promise<Article> => {
  try {
    const { id, ...dataToSend } = articleData; 
    const response: AxiosResponse<Article> = await adminApi.post('', dataToSend);
    return response.data;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

export const updateArticle = async (id: string, articleData: Article): Promise<Article> => {
  try {
    const dataToSend = { ...articleData, id }; 
    const response: AxiosResponse<Article> = await adminApi.put(`/${id}`, dataToSend);
    return response.data;
  } catch (error) {
    console.error(`Error updating article with ID ${id}:`, error);
    throw error;
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    await adminApi.delete(`/${id}`);
  } catch (error) {
    console.error(`Error deleting article with ID ${id}:`, error);
    throw error;
  }
};


// =================================================================
// 4. CÁC HÀM GỌI API (PUBLIC) - ĐÃ SỬA
// =================================================================

/**
 * Lấy danh sách tin tức đã xuất bản theo Menu (Mục tiêu: getPublishedNewsByMenu)
 * GET /api/news?menu={menu}
 * @param menu - Tên menu cần lấy bài viết (VD: homepage, blog, etc.)
 */
export const getPublishedNewsByMenu = async (menu: string): Promise<Article[]> => { // ĐÃ SỬA HÀM NÀY
    try {
        // Gọi đến Public Controller /api/news với tham số menu
        const response: AxiosResponse<Article[]> = await publicApi.get('/byMenu', { 
            params: { menu } 
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching published news for menu ${menu}:`, error);
        throw error;
    }
};

/**
 * Lấy chi tiết bài viết công khai (dành cho NewsDetailPage)
 * GET /api/news/{id}
 */
export const getPublicArticleById = async (id: string): Promise<Article> => {
    try {
        const response: AxiosResponse<Article> = await publicApi.get(`/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching public article with ID ${id}:`, error);
        throw error;
    }
};

adminApi.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('momang_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    // Lưu ý: user.token phải tồn tại sau khi bạn đăng nhập thật
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});