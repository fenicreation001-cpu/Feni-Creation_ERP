import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('feni_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('feni_user');
      }
    } else {
      // Default auto-login as Admin for seamless demonstration
      const defaultAdmin: User = {
        id: 'u1',
        name: 'Feni Creation Admin',
        email: 'fenicreation001@gmail.com',
        role: 'Admin',
      };
      setUser(defaultAdmin);
      localStorage.setItem('feni_user', JSON.stringify(defaultAdmin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('feni_user', JSON.stringify(data.user));
        return true;
      }
    } catch {
      // Fallback offline login
      const adminUser: User = {
        id: 'u1',
        name: 'Admin - Feni Creation',
        email: email || 'fenicreation001@gmail.com',
        role: 'Admin',
      };
      setUser(adminUser);
      localStorage.setItem('feni_user', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('feni_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
