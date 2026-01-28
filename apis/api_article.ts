import { AxiosResponse } from 'axios';
import axiosClient from '@/axiosclient';
import { Article, ArticleStatus } from '@/type';
export type { Article, ArticleStatus };
// =================================================================
// 2. CẤU HÌNH API
// =================================================================
// Using centralized axiosClient for proper authentication handling


// =================================================================
// 3. CÁC HÀM GỌI API (ADMIN) - Giữ nguyên
// =================================================================

/**
 * Lấy danh sách tất cả bài viết (dùng cho trang AdminNews)
 * GET /api/admin/news
 */
export const getAllArticles = async (): Promise<Article[]> => {
  try {
    const response: any = await axiosClient.get('/admin/news');
    // Handle different response structures
    const articles = response?.data || response || [];
    return Array.isArray(articles) ? articles : [];
  } catch (error) {
    console.error('Error fetching all articles:', error);
    throw error;
  }
};

// ... (getArticleById, createArticle, updateArticle, deleteArticle giữ nguyên) ...

export const getArticleById = async (id: string): Promise<Article> => {
  try {
    const response: any = await axiosClient.get(`/admin/news/${id}`);
    return response?.data || response;
  } catch (error) {
    console.error(`Error fetching article with ID ${id}:`, error);
    throw error;
  }
};

export const createArticle = async (articleData: Article): Promise<Article> => {
  try {
    const { id, ...dataToSend } = articleData;
    const response: any = await axiosClient.post('/admin/news', dataToSend);
    return response?.data || response;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
};

export const updateArticle = async (id: string, articleData: Article): Promise<Article> => {
  try {
    const dataToSend = { ...articleData, id };
    const response: any = await axiosClient.put(`/admin/news/${id}`, dataToSend);
    return response?.data || response;
  } catch (error) {
    console.error(`Error updating article with ID ${id}:`, error);
    throw error;
  }
};

export const deleteArticle = async (id: string): Promise<void> => {
  try {
    await axiosClient.delete(`/admin/news/${id}`);
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
export const getPublishedNewsByMenu = async (menu: string): Promise<Article[]> => {
  try {
    // Gọi đến Public Controller /api/news với tham số menu
    const response: any = await axiosClient.get('/news/byMenu', {
      params: { menu }
    });
    const articles = response?.data || response || [];
    return Array.isArray(articles) ? articles : [];
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
    const response: any = await axiosClient.get(`/news/${id}`);
    return response?.data || response;
  } catch (error) {
    console.error(`Error fetching public article with ID ${id}:`, error);
    throw error;
  }
};

// Authentication is now handled by the centralized axiosClient interceptor
// No need for custom interceptor here