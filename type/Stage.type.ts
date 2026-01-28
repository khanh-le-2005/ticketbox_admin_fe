export type SeatType = "standard" | "vip" | "blocked" | "custom";

export interface Seat {
  id: string;
  label: string;
  type: SeatType;
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
}