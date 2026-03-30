import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  auth, businesses,
  getToken, setToken, clearToken,
  getStoredUser, setStoredUser,
  getStoredCompany, setStoredCompany,
} from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(getStoredUser);
  const [company, setCompany] = useState(getStoredCompany);
  const [allBizs, setAllBizs] = useState([]);
  const [loading, setLoading] = useState(true);

  // On mount — verify token is still valid
  useEffect(() => {
    const verify = async () => {
      if (!getToken()) { setLoading(false); return; }
      try {
        const data = await auth.me();
        setUser(data.user);
        setCompany(data.company);
        setStoredUser(data.user);
        setStoredCompany(data.company);
        await loadBusinesses();
      } catch {
        clearToken();
        setUser(null);
        setCompany(null);
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const loadBusinesses = async () => {
    try {
      const data = await businesses.list();
      setAllBizs(data.businesses || []);
    } catch {}
  };

  const login = useCallback(async (email, password) => {
    const data = await auth.login({ email, password });
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company);
    setStoredUser(data.user);
    setStoredCompany(data.company);
    await loadBusinesses();
    return data;
  }, []);

  const register = useCallback(async (formData) => {
    const data = await auth.register(formData);
    setToken(data.token);
    setUser(data.user);
    setCompany(data.company);
    setStoredUser(data.user);
    setStoredCompany(data.company);
    return data;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem('fg_user');
    localStorage.removeItem('fg_company');
    setUser(null);
    setCompany(null);
    setAllBizs([]);
    window.location.href = '/login';
  }, []);

  const switchBusiness = useCallback(async (bizId) => {
    const data = await businesses.switch(bizId);
    setToken(data.token);
    setCompany(data.company);
    setStoredCompany(data.company);
    // Reload page so all data refreshes for new company
    window.location.reload();
  }, []);

  const isTrialExpired = () => {
    // Check plan and trial status from company
    return false; // TODO: implement based on company.trialEndsAt
  };

  return (
    <AuthContext.Provider value={{
      user, company, allBizs,
      loading, isLoggedIn: !!user,
      login, register, logout,
      switchBusiness, loadBusinesses,
      isTrialExpired,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
