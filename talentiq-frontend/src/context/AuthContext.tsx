import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

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

/* ─── Normalise roles from any shape the backend may return ─── */
const parseRoles = (rawRoles: any): string[] => {
  if (!rawRoles) return [];
  if (Array.isArray(rawRoles)) {
    return rawRoles.map((r: any) =>
      typeof r === 'string' ? r : r?.name || r?.role || String(r)
    );
  }
  if (typeof rawRoles === 'object') return Object.values(rawRoles) as string[];
  return [];
};

const parseUserFromAuthData = (data: any): UserProfile => {
  const roles = parseRoles(data.roles);
  return {
    id: data.userId || data.id,
    email: data.email,
    firstName: data.firstName || data.first_name || '',
    lastName: data.lastName || data.last_name || '',
    roles,
    status: data.status || 'ACTIVE',
    emailVerified: data.emailVerified ?? true,
  };
};

/* ─── Role-check helpers covering all backend naming conventions ─── */
const checkIsHr = (roles: string[]) =>
  roles.some(r =>
    ['ROLE_HR', 'HR', 'ROLE_RECRUITER', 'RECRUITER', 'ROLE_HR_MANAGER', 'HR_MANAGER'].includes(r.toUpperCase())
  );

const checkIsAdmin = (roles: string[]) =>
  roles.some(r =>
    ['ROLE_SUPER_ADMIN', 'ROLE_PLATFORM_ADMIN', 'SUPER_ADMIN', 'ADMIN', 'ROLE_ADMIN',
     'PLATFORM_ADMIN'].includes(r.toUpperCase())
  );

const checkIsCandidate = (roles: string[]) =>
  roles.some(r =>
    ['ROLE_CANDIDATE', 'CANDIDATE', 'ROLE_USER', 'USER'].includes(r.toUpperCase())
  );

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /* On mount, if a token exists re-validate the session */
  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await apiClient.get('/users/me');
          const userData = res.data.data || res.data;
          const userObj = parseUserFromAuthData(userData);
          setUser(userObj);
          localStorage.setItem('user', JSON.stringify(userObj));
        } catch (e) {
          // Token expired or invalid — fall back to cached user
          const saved = localStorage.getItem('user');
          if (saved) {
            try { setUser(JSON.parse(saved)); } catch { /* ignore */ }
          }
        }
      }
      setIsLoading(false);
    };
    verifyUser();
  }, []);

  /* Login: get token → immediately fetch /users/me for fresh roles */
  const login = async (credentials: any) => {
    const res = await apiClient.post('/auth/login', credentials);
    const authData = res.data.data || res.data;

    if (authData.accessToken) {
      localStorage.setItem('accessToken', authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }

    // Parse what the login endpoint returned first
    let authUser = parseUserFromAuthData(authData);

    // Immediately fetch /users/me to get accurate roles (login response sometimes omits them)
    try {
      const meRes = await apiClient.get('/users/me');
      const meData = meRes.data.data || meRes.data;
      authUser = parseUserFromAuthData({ ...authData, ...meData });
    } catch {
      // If /users/me fails, trust what login gave us
    }

    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const register = async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    const authData = res.data.data || res.data;

    if (authData.accessToken) {
      localStorage.setItem('accessToken', authData.accessToken);
    }
    if (authData.refreshToken) {
      localStorage.setItem('refreshToken', authData.refreshToken);
    }

    let authUser = parseUserFromAuthData(authData);
    try {
      const meRes = await apiClient.get('/users/me');
      const meData = meRes.data.data || meRes.data;
      authUser = parseUserFromAuthData({ ...authData, ...meData });
    } catch { /* use what register returned */ }

    localStorage.setItem('user', JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const roles = user?.roles || [];

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      isCandidate: checkIsCandidate(roles),
      isHr: checkIsHr(roles),
      isAdmin: checkIsAdmin(roles),
      login,
      register,
      logout,
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
