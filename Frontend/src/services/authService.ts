const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface User {
  username: string;
  email: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadTokensFromStorage();
    this.setupTokenRefresh();
  }

  private loadTokensFromStorage(): void {
    const storedAccessToken = localStorage.getItem("access_token");
    const storedRefreshToken = localStorage.getItem("refresh_token");
    
    if (storedAccessToken && storedRefreshToken) {
      this.accessToken = storedAccessToken;
      this.refreshToken = storedRefreshToken;
    }
  }

  private saveTokensToStorage(tokens: AuthTokens): void {
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
    
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
  }

  private clearTokensFromStorage(): void {
    this.accessToken = null;
    this.refreshToken = null;
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }

  private setupTokenRefresh(): void {
    if (this.accessToken && this.refreshToken) {
      // Set up automatic token refresh 5 minutes before expiration
      // Since our tokens last 7 days, we'll refresh every 6 days
      const refreshInterval = 6 * 24 * 60 * 60 * 1000; // 6 days in milliseconds
      
      this.refreshTimeout = setTimeout(() => {
        this.refreshTokens();
      }, refreshInterval);
    }
  }

  async login(username: string, password: string): Promise<AuthTokens> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const tokens = await response.json();
    this.saveTokensToStorage(tokens);
    this.setupTokenRefresh();
    return tokens;
  }

  async register(username: string, email: string, password: string): Promise<AuthTokens> {
    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        email,
        password,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    const tokens = await response.json();
    this.saveTokensToStorage(tokens);
    this.setupTokenRefresh();
    return tokens;
  }

  async refreshTokens(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_BASE}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: this.refreshToken,
      }),
    });

    if (!response.ok) {
      this.logout();
      throw new Error("Token refresh failed");
    }

    const tokens = await response.json();
    this.saveTokensToStorage(tokens);
    this.setupTokenRefresh();
    return tokens;
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          await this.refreshTokens();
          return this.getCurrentUser(); // Retry with new token
        }
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  logout(): void {
    this.clearTokensFromStorage();
    
    // Clear churn prediction cache
    localStorage.removeItem("churnPredictionData");
    localStorage.removeItem("churnPredictionCustomers");
    localStorage.removeItem("churnPredictionExpiry");
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  // Method to add authorization header to requests
  getAuthHeaders(): Record<string, string> {
    if (!this.accessToken) {
      return {};
    }
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }
}

// Create a singleton instance
export const authService = new AuthService(); 