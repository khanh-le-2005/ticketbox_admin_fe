export interface Staff {
  id?: string;
  fullName: string;
  username: string;
  email: string;
  phone?: string;
  role: 'VAN_HANH' | 'QUET_VE';
  active?: boolean;
  createdAt?: string;
  password?: string;
}