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