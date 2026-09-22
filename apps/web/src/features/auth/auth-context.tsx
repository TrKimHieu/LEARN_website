'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RegisterInput, LoginInput, UserPublic } from '@learn/contracts';
import { apiFetch, refreshAccessToken, setAccessToken } from '@/lib/api-client';

export type AuthStatus = 'loading' | 'authed' | 'guest';

export interface AuthContextValue {
  status: AuthStatus;
  user: UserPublic | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserPublic | null>(null);

  /** Khởi động app → thử refresh để lấy access token + hồ sơ (cookie httpOnly). */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ok = await refreshAccessToken();
      if (cancelled) return;
      if (!ok) {
        setStatus('guest');
        return;
      }
      try {
        const data = await apiFetch<{ user: UserPublic }>('/api/v1/auth/me');
        setUser(data.user);
        setStatus('authed');
      } catch {
        if (cancelled) return;
        setAccessToken(null);
        setUser(null);
        setStatus('guest');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const data = await apiFetch<{ user: UserPublic; accessToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: input,
    });
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authed');
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const data = await apiFetch<{ user: UserPublic; accessToken: string }>(
      '/api/v1/auth/register',
      { method: 'POST', body: input },
    );
    setAccessToken(data.accessToken);
    setUser(data.user);
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // phiên hết hạn/mất mạng — vẫn đăng xuất ở client
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await apiFetch('/api/v1/auth/logout-all', { method: 'POST' });
    } catch {
      // tương tự logout
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('guest');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, register, logout, logoutAll }),
    [status, user, login, register, logout, logoutAll],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>.');
  return ctx;
}
