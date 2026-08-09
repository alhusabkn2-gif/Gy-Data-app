import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  referral_code: string;
  referred_by: string | null;
  wallet_balance: number;
  cashback_balance: number;
  kyc_status: string;
  is_admin: boolean;
  created_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (phone: string, pin: string) => Promise<{ error: string | null }>;
  register: (data: RegisterData) => Promise<{ error: string | null }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateWalletBalance: (balance: number) => void;
}

interface RegisterData {
  full_name: string;
  phone: string;
  email?: string;
  referral_code?: string;
  login_pin: string;
  purchase_pin: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'gydata_session';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:10000';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const saveSession = (profile: UserProfile) => {
    setUser(profile);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phone: profile.phone,
      })
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (!parsed.phone) {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    }
  }, []);

  const login = async (phone: string, pin: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          login_pin: pin,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          error: result.message || 'Login failed.',
        };
      }

      saveSession(result.user);

      return { error: null };
    } catch (error) {
      console.error('Login error:', error);

      return {
        error: 'Unable to connect to server.',
      };
    }
  };

  const register = async (regData: RegisterData) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: regData.full_name,
          phone: regData.phone,
          email: regData.email || null,
          referral_code: regData.referral_code || null,
          login_pin: regData.login_pin,
          purchase_pin: regData.purchase_pin,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return {
          error: result.message || 'Registration failed.',
        };
      }

      saveSession(result.user);

      return { error: null };
    } catch (error) {
      console.error('Registration error:', error);

      return {
        error: 'Unable to connect to server.',
      };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: user.phone,
            login_pin: '',
          }),
        }
      );

      if (!response.ok) return;
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const updateWalletBalance = (balance: number) => {
    setUser((prev) =>
      prev
        ? {
            ...prev,
            wallet_balance: balance,
          }
        : prev
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        updateWalletBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return ctx;
}
