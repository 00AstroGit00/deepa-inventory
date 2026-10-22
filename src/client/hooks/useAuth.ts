import { useState, useEffect, useCallback, createContext, useContext, ReactNode, createElement } from 'react';
import { api } from '../api';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await api.me();
      setUser(userData);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    await api.login(email, password);
    await refreshUser();
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await api.changePassword(currentPassword, newPassword);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    changePassword,
    refreshUser,
  };

  // Use createElement to avoid esbuild JSX parsing issue with 'value' prop
  return createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}