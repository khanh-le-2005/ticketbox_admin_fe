import axiosClient from '../axiosclient';
import { DashboardStatResponse, RevenueChartResponse } from '@/type/stats.type';
export type { DashboardStatResponse, RevenueChartResponse };
/**
 * Lấy số liệu tổng quan cho Dashboard
 * GET /api/stats/dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStatResponse> => {
  // axiosClient đã trả về response.data (ApiResponse), 
  // nên ta lấy .data tiếp để ra DashboardStatResponse thật
  const res = await axiosClient.get<any, any>('/stats/dashboard');
  return res.data; 
};

/**
 * Lấy dữ liệu biểu đồ doanh thu
 * GET /api/stats/revenue-chart
 * @param showId (Optional) - Nếu null thì lấy tất cả
 * @param groupBy (Optional) - 'day' hoặc 'hour' (mặc định server là day)
 */
export const getRevenueChart = async (showId?: string, groupBy: 'day' | 'hour' = 'day'): Promise<RevenueChartResponse[]> => {
  const params = { showId, groupBy };
  const res = await axiosClient.get<any, any>('/stats/revenue-chart', { params });
  return res.data;
};