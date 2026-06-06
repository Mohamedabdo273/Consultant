import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data.data);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) fetchMe();
    else setLoading(false);
  }, [fetchMe]);

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials);
    const dto = data.data; // flat AuthResponseDto — no nested user object

    // 2FA required — backend sets requires2FA = true (camelCase from Requires2FA)
    if (dto.requires2FA) {
      return { requiresTwoFactor: true, twoFactorEmail: credentials.email };
    }

    localStorage.setItem('accessToken', dto.accessToken);
    localStorage.setItem('refreshToken', dto.refreshToken);

    // Build user object from the flat DTO fields
    setUser({
      id:        dto.userId,
      companyId: dto.companyId,
      fullName:  dto.fullName,
      email:     dto.email,
      role:      dto.role,
      avatarUrl: dto.avatarUrl ?? null,
    });

    return { requiresTwoFactor: false };
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.clear();
    setUser(null);
  };

  const updateUser = (updates) => setUser(prev => ({ ...prev, ...updates }));

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
