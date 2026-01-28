export interface DashboardRoomInfo {
  id: string;
  roomNumber: string;
  roomTypeCode: string;
}

export interface DashboardStatusGroup {
  count: number;
  rooms: DashboardRoomInfo[];
}

export interface HotelDashboardData {
  available: DashboardStatusGroup;
  occupied: DashboardStatusGroup;
  dirty: DashboardStatusGroup;
  maintenance: DashboardStatusGroup;
}

export interface RoomTypeState {
  name: string;
  totalRooms: number;
  standardCapacity: number;
  maxCapacity: number;
  priceMonToThu: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
  surchargeSunToThu: number;
  surchargeFriSat: number;
}