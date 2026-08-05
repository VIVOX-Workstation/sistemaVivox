import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

interface User {
  id: string;
  nome: string;
  email: string;
}

interface AuthContextData {
  user: User | null;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedToken = localStorage.getItem('@Vivox:token');
    const storedUser = localStorage.getItem('@Vivox:user');
    if (storedToken && storedUser) {
      return JSON.parse(storedUser);
    }
    return null;
  });

  const signIn = (token: string, loggedUser: User) => {
    localStorage.setItem('@Vivox:token', token);
    localStorage.setItem('@Vivox:user', JSON.stringify(loggedUser));
    setUser(loggedUser);
  };

  const signOut = () => {
    localStorage.removeItem('@Vivox:token');
    localStorage.removeItem('@Vivox:user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
