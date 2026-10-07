import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export type UserRole = 'ADMIN' | 'COLABORADOR' | 'CLIENTE';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  clienteId?: string | null;
  modulos?: string[];
}

interface AuthContextData {
  user: User | null;
  signIn: (token: string, user: User) => void;
  signOut: () => void;
  isAuthenticated: boolean;
  podeAcessar: (modulo: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedToken = localStorage.getItem('@Vivox:token');
    const storedUser = localStorage.getItem('@Vivox:user');
    if (storedToken && storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch {
        return null;
      }
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

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('@Vivox:token');
    if (!token) return;
    try {
      const response = await api.get('/auth/me');
      if (response.data) {
        setUser(response.data);
        localStorage.setItem('@Vivox:user', JSON.stringify(response.data));
      }
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário via /auth/me:', error);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem('@Vivox:token');
    if (storedToken && user && user.role !== 'CLIENTE') {
      refreshUser();
    }
  }, []);

  const podeAcessar = useCallback(
    (modulo: string): boolean => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      // Sessão antiga (salva antes dos módulos existirem): libera até o /auth/me responder;
      // o backend continua barrando com 403 o que não for permitido.
      if (!user.modulos) return true;
      return user.modulos.includes(modulo);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isAuthenticated: !!user,
        podeAcessar,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
