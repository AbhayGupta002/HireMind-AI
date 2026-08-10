import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, clearStoredAuth, getStoredToken } from '../api/client';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  status?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isCandidate: boolean;
  isHr: boolean;
  isAdmin: boolean;
  login: (credentials: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseUserFromAuthData = (data: any): UserProfile => {
  const rolesArray = Array.isArray(data.roles)
    ? data.roles
    : (data.roles ? Object.values(data.roles) : []);

  return {
    id: data.userId || data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    roles: rolesArray,
    status: data.status || 'ACTIVE',
    emailVerified: data.emailVerified ?? true
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      // Check sessionStorage first for active tab security
      const saved = sessionStorage.getItem('user') || localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = () => {
    clearStoredAuth();
    setUser(null);
  };

  useEffect(() => {
    const verifyUser = async () => {
      const token = getStoredToken();
      if (!token) {
        logout();
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiClient.get('/users/me');
        const userData = res.data.data;
        const userObj = parseUserFromAuthData(userData);
        setUser(userObj);
        sessionStorage.setItem('user', JSON.stringify(userObj));
      } catch (e) {
        console.warn('Session verification failed, logging out:', e);
        logout(); // Strictly log out on session check failure
      } finally {
        setIsLoading(false);
      }
    };
    verifyUser();
  }, []);

  const login = async (credentials: any) => {
    const res = await apiClient.post('/auth/login', credentials);
    const authData = res.data.data;
    
    // Store in sessionStorage so window/tab closure automatically logs out for security
    if (authData.accessToken) {
      sessionStorage.setItem('accessToken', authData.accessToken);
    }
    if (authData.refreshToken) {
      sessionStorage.setItem('refreshToken', authData.refreshToken);
    }
    const authUser = parseUserFromAuthData(authData);
    sessionStorage.setItem('user', JSON.stringify(authUser));
    
    // Clean old localStorage items to avoid stale auto-login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    setUser(authUser);
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    const authData = res.data.data;

    if (authData.accessToken) {
      sessionStorage.setItem('accessToken', authData.accessToken);
    }
    if (authData.refreshToken) {
      sessionStorage.setItem('refreshToken', authData.refreshToken);
    }
    const authUser = parseUserFromAuthData(authData);
    sessionStorage.setItem('user', JSON.stringify(authUser));

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');

    setUser(authUser);
  };

  const roles = user?.roles || [];
  const isCandidate = roles.includes('ROLE_CANDIDATE') || roles.includes('CANDIDATE');
  const isHr = roles.includes('ROLE_HR') || roles.includes('HR');
  const isAdmin = roles.includes('ROLE_SUPER_ADMIN') || roles.includes('ROLE_PLATFORM_ADMIN') || roles.includes('SUPER_ADMIN');

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isCandidate,
      isHr,
      isAdmin,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
