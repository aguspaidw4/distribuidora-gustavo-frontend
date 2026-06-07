import {
  createContext,
  useContext,
  useState,
} from 'react';
import api from '../api/axios';

type UserRole = 'ADMIN' | 'OWNER' | 'CLIENT';

type AuthUser = {
  userId: number;
  email: string;
  role: UserRole;
};

type AuthContextType = {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

function parseToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const storedToken = localStorage.getItem('token');

  const [token, setToken] = useState<string | null>(storedToken);
  const [user, setUser] = useState<AuthUser | null>(
    storedToken ? parseToken(storedToken) : null,
  );

  async function login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const accessToken = response.data.access_token;

    localStorage.setItem('token', accessToken);
    setToken(accessToken);
    setUser(parseToken(accessToken));
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}