export type SeatType = "standard" | "vip" | "guest" | "blocked" | "custom";
export type SeatStatus = "AVAILABLE" | "BOOKED" | "WAITING" | "CHECKED_IN" | "guest" | "RESERVED";

export interface Seat {
  id: string;
  label: string;
  type: SeatType;
  status: SeatStatus;
  row: number;
  col: number;
  customColor?: string;
  isOccupied?: boolean;
}

export interface Zone {
  id: string;
  name: string;
  rows: number;
  cols: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats: Seat[];
  isBox: boolean;
}

export interface StageData {
  id: string;
  name: string;
  zones: Zone[];
  lastModified: string;
  version?: number;
  seatTypeCounts?: Record<string, number>;
  seatStatusCounts?: Record<string, number>;
  seatDetailedStats?: Record<string, Record<string, number>>;
}