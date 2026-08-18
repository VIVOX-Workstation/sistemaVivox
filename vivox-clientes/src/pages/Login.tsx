import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import LoginVivox from '../components/LoginVivox';

export default function Login() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { email: string; senha: string; lembrar: boolean }) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/auth/login', { email: data.email, senha: data.senha });
      const { access_token, user } = response.data;
      signIn(access_token, user);
      
      // Armazena a flag para que o Intro rode logo em seguida
      sessionStorage.setItem('@Vivox:showIntro', 'true');
      
      window.location.href = '/'; // Redireciona para Dashboard após login
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginVivox 
      onSubmit={handleLogin}
      loading={loading}
      error={error}
    />
  );
}
