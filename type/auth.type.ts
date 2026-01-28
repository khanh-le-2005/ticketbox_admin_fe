export interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserSummary;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}