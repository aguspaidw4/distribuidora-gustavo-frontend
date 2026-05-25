import {
  createContext,
  useContext,
  useState,
} from 'react';

import api from '../api/axios';

type AuthContextType = {
  token: string | null;

  login: (
    email: string,
    password: string,
  ) => Promise<void>;

  logout: () => void;
};

const AuthContext =
  createContext<AuthContextType>(
    {} as AuthContextType,
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [token, setToken] =
    useState<string | null>(
      localStorage.getItem('token'),
    );

  async function login(
    email: string,
    password: string,
  ) {

    const response =
      await api.post('/auth/login', {
        email,
        password,
      });

    const accessToken =
      response.data.access_token;

    localStorage.setItem(
      'token',
      accessToken,
    );

    setToken(accessToken);
  }

  function logout() {
    localStorage.removeItem('token');

    setToken(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}