import axiosClient from '../axiosclient';

// =================================================================
// 1. INTERFACES (Khớp với DTO Java)
// =================================================================

export interface DashboardStatResponse {
  totalRevenue: number;
  totalTicketsSold: number;
  totalTicketsCheckIn: number;
  totalCapacity: number;
  occupancyRate: number; // Tỷ lệ lấp đầy
  checkInRate: number;   // Tỷ lệ check-in
}

export interface RevenueChartResponse {
  revenue: number;
  timeLabel: string; // Ngày hoặc Giờ
}

// =================================================================
// 2. API FUNCTIONS
// =================================================================

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