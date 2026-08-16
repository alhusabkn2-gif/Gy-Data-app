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
  superAdmin: boolean;
  login: (
    phone: string,
    pin: string
  ) => Promise<{ error: string | null }>;
  loginSuperAdmin: (
    email: string,
    pin: string
  ) => Promise<{ error: string | null }>;
  register: (
    data: RegisterData
  ) => Promise<{ error: string | null }>;
  logout: () => void;
  logoutSuperAdmin: () => void;
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

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  );

const STORAGE_KEY = 'gydata_session';

const SUPER_ADMIN_SESSION =
  'gydata_super_admin_session';

const SUPER_ADMIN_SESSION_EXPIRY =
  'gydata_super_admin_session_expiry';

const API_URL =
  import.meta.env.VITE_API_URL ||
  '';

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] = useState<UserProfile | null>(null);

  const [
    superAdmin,
    setSuperAdmin,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const saveSession = (
    profile: UserProfile
  ) => {
    setUser(profile);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: profile,
      })
    );
  };

  /*
   * Restore normal user session
   * and Super Admin signed session.
   */
  useEffect(() => {
    const restoreSession = () => {
      try {
        const stored =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (stored) {
          const parsed =
            JSON.parse(stored);

          if (parsed?.user) {
            setUser(
              parsed.user
            );
          }
        }

        const adminToken =
          localStorage.getItem(
            SUPER_ADMIN_SESSION
          );

        const adminExpiry =
          Number(
            localStorage.getItem(
              SUPER_ADMIN_SESSION_EXPIRY
            ) || 0
          );

        if (
          adminToken &&
          adminExpiry > Date.now()
        ) {
          setSuperAdmin(true);
          setUser(null);
        } else {
          localStorage.removeItem(
            SUPER_ADMIN_SESSION
          );

          localStorage.removeItem(
            SUPER_ADMIN_SESSION_EXPIRY
          );

          setSuperAdmin(false);
        }
      } catch (error) {
        console.error(
          'Session restore error:',
          error
        );

        localStorage.removeItem(
          STORAGE_KEY
        );

        localStorage.removeItem(
          SUPER_ADMIN_SESSION
        );

        localStorage.removeItem(
          SUPER_ADMIN_SESSION_EXPIRY
        );

        setUser(null);
        setSuperAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  /*
   * Normal customer login.
   */
  const login = async (
    phone: string,
    pin: string
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                phone,
                login_pin: pin,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !result.success
      ) {
        return {
          error:
            result.message ||
            'Login failed.',
        };
      }

      /*
       * A normal customer login
       * must clear any Super Admin session.
       */
      setSuperAdmin(false);

      localStorage.removeItem(
        SUPER_ADMIN_SESSION
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY
      );

      saveSession(
        result.user
      );

      return {
        error: null,
      };
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      return {
        error:
          'Unable to connect to server.',
      };
    }
  };

  /*
   * Super Admin login.
   *
   * IMPORTANT:
   * There is NO hard-coded email or PIN here.
   *
   * Authentication is handled by:
   * /api/auth/super-admin-login
   */
  const loginSuperAdmin = async (
    email: string,
    pin: string
  ) => {
    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (!cleanEmail) {
      return {
        error:
          'Enter your Super Admin email.',
      };
    }

    if (
      !/^\d{4}$/.test(pin)
    ) {
      return {
        error:
          'Enter your 4-digit Super Admin PIN.',
      };
    }

    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/super-admin-login`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                email:
                  cleanEmail,
                pin,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        result.success !== true ||
        !result.token
      ) {
        return {
          error:
            result.message ||
            'Invalid Super Admin credentials.',
        };
      }

      /*
       * Store only the signed token.
       * Never store the Super Admin PIN.
       */
      localStorage.setItem(
        SUPER_ADMIN_SESSION,
        result.token
      );

      localStorage.setItem(
        SUPER_ADMIN_SESSION_EXPIRY,
        String(
          result.expiresAt ||
            Date.now() +
              12 *
                60 *
                60 *
                1000
        )
      );

      /*
       * Clear normal customer session.
       */
      setUser(null);

      localStorage.removeItem(
        STORAGE_KEY
      );

      setSuperAdmin(true);

      return {
        error: null,
      };
    } catch (error) {
      console.error(
        'Super Admin login error:',
        error
      );

      return {
        error:
          'Unable to connect to server.',
      };
    }
  };

  /*
   * Customer registration.
   */
  const register = async (
    regData: RegisterData
  ) => {
    try {
      const response =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body:
              JSON.stringify({
                full_name:
                  regData.full_name,

                phone:
                  regData.phone,

                email:
                  regData.email ||
                  null,

                referral_code:
                  regData.referral_code ||
                  null,

                login_pin:
                  regData.login_pin,

                purchase_pin:
                  regData.purchase_pin,
              }),
          }
        );

      const result =
        await response
          .json()
          .catch(
            () => ({})
          );

      if (
        !response.ok ||
        !result.success
      ) {
        return {
          error:
            result.message ||
            'Registration failed.',
        };
      }

      setSuperAdmin(false);

      localStorage.removeItem(
        SUPER_ADMIN_SESSION
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY
      );

      saveSession(
        result.user
      );

      return {
        error: null,
      };
    } catch (error) {
      console.error(
        'Registration error:',
        error
      );

      return {
        error:
          'Unable to connect to server.',
      };
    }
  };

  /*
   * Refresh normal customer session.
   */
  const refreshUser =
    async () => {
      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (!stored) {
        return;
      }

      try {
        const parsed =
          JSON.parse(stored);

        if (parsed?.user) {
          setUser(
            parsed.user
          );
        }
      } catch (error) {
        console.error(
          'Refresh user error:',
          error
        );

        localStorage.removeItem(
          STORAGE_KEY
        );

        setUser(null);
      }
    };

  /*
   * Normal customer logout.
   */
  const logout = () => {
    setUser(null);

    localStorage.removeItem(
      STORAGE_KEY
    );
  };

  /*
   * Super Admin logout.
   */
  const logoutSuperAdmin =
    () => {
      setSuperAdmin(false);

      localStorage.removeItem(
        SUPER_ADMIN_SESSION
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY
      );
    };

  /*
   * Update customer wallet balance.
   */
  const updateWalletBalance = (
    balance: number
  ) => {
    setUser(
      (previousUser) => {
        if (!previousUser) {
          return previousUser;
        }

        const updatedUser = {
          ...previousUser,
          wallet_balance:
            balance,
        };

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user: updatedUser,
          })
        );

        return updatedUser;
      }
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        superAdmin,
        login,
        loginSuperAdmin,
        register,
        logout,
        logoutSuperAdmin,
        refreshUser,
        updateWalletBalance,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
}

