import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User { id: string; name: string; email: string; }
interface Org { id: string; name: string; slug: string; plan: string; }

interface AuthStore {
  user: User | null;
  org: Org | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, orgName: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      org: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ user: data.user, org: data.org, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      register: async (name, email, password, orgName) => {
        const { data } = await api.post('/auth/register', { name, email, password, orgName });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ user: data.user, org: data.org, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
      },

      logout: () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) api.post('/auth/logout', { refreshToken }).catch(() => {});
        localStorage.clear();
        set({ user: null, org: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    { name: 'devmetrics-auth', partialize: (s) => ({ user: s.user, org: s.org, isAuthenticated: s.isAuthenticated }) }
  )
);
