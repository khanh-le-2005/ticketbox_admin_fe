
// Fix: Import React to resolve React.ReactNode namespace error
import React from 'react';

export interface User {
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

export interface NavItem {
  id: string;
  label: string;
  // Use React.ReactNode for the icon property
  icon: React.ReactNode;
  path: string;
}
