import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
  referral_code: string;
  referred_by: string | null;
  login_pin: string;
  purchase_pin: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        fetchUser(parsed.phone).then((u) => {
          if (u) setUser(u);
          else localStorage.removeItem(STORAGE_KEY);
          setLoading(false);
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async (phone: string): Promise<UserProfile | null> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error || !data) return null;
    return data as UserProfile;
  };

  const login = async (phone: string, pin: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) return { error: 'Network error. Please try again.' };
    if (!data) return { error: 'Account not found. Please register.' };
    if (data.login_pin !== pin) return { error: 'Incorrect PIN.' };

    setUser(data as UserProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: data.phone }));

    return { error: null };
  };

  const register = async (regData: RegisterData) => {
    const { data: existing } = await supabase
      .from('profiles')
      .select('phone')
      .eq('phone', regData.phone)
      .maybeSingle();

    if (existing) {
      return { error: 'Phone number already registered.' };
    }

    let referredBy: string | null = null;

    if (regData.referral_code) {
      const { data: referrer } = await supabase
        .from('profiles')
        .select('phone')
        .eq('referral_code', regData.referral_code.toUpperCase())
        .maybeSingle();

      if (referrer) referredBy = referrer.phone;
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        full_name: regData.full_name,
        phone: regData.phone,
        email: regData.email || null,
        referred_by: referredBy,
        login_pin: regData.login_pin,
        purchase_pin: regData.purchase_pin,
        wallet_balance: 0,
        kyc_status: 'unverified',
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase registration error:', error);
      return { error: error.message };
    }

    if (referredBy) {
      await supabase.from('referrals').insert({
        referrer_phone: referredBy,
        referred_phone: regData.phone,
        reward_amount: 100,
        status: 'completed',
      });
    }

    setUser(data as UserProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ phone: data.phone }));

    return { error: null };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshUser = async () => {
    if (!user) return;

    const u = await fetchUser(user.phone);

    if (u) setUser(u);
  };

  const updateWalletBalance = (balance: number) => {
    setUser((prev) => (prev ? { ...prev, wallet_balance: balance } : prev));
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
