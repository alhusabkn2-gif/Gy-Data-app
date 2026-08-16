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
  ) => Promise<{
    error: string | null;
  }>;

  loginSuperAdmin: (
    email: string,
    pin: string
  ) => Promise<{
    error: string | null;
  }>;

  register: (
    data: RegisterData
  ) => Promise<{
    error: string | null;
  }>;

  logout: () => void;
  logoutSuperAdmin: () => void;

  refreshUser: () => Promise<void>;

  updateWalletBalance: (
    balance: number
  ) => void;
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
  createContext<
    AuthContextType | undefined
  >(undefined);


const STORAGE_KEY =
  'gydata_session';

const SUPER_ADMIN_KEY =
  'gydata_super_admin';

const SUPER_ADMIN_SESSION =
  'gydata_super_admin_session';

const SUPER_ADMIN_SESSION_EXPIRY =
  'gydata_super_admin_session_expiry';


const API_URL =
  String(
    import.meta.env.VITE_API_URL || ''
  ).replace(/\/+$/, '');


export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] =
    useState<UserProfile | null>(
      null
    );

  const [
    superAdmin,
    setSuperAdmin,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(true);


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


  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      const token =
        localStorage.getItem(
          SUPER_ADMIN_SESSION
        );

      const expiry =
        Number(
          localStorage.getItem(
            SUPER_ADMIN_SESSION_EXPIRY
          ) || 0
        );

      const legacySuperAdmin =
        localStorage.getItem(
          SUPER_ADMIN_KEY
        );


      if (stored) {
        const parsed =
          JSON.parse(
            stored
          );

        if (
          parsed?.user
        ) {
          setUser(
            parsed.user
          );
        }
      }


      if (
        token &&
        expiry > Date.now()
      ) {
        setSuperAdmin(
          true
        );
      } else {
        localStorage.removeItem(
          SUPER_ADMIN_SESSION
        );

        localStorage.removeItem(
          SUPER_ADMIN_SESSION_EXPIRY
        );

        setSuperAdmin(
          false
        );
      }


      /*
       * Remove the old boolean-only
       * Super Admin authentication flag.
       *
       * A boolean in localStorage is
       * not a valid authentication session.
       */
      if (
        legacySuperAdmin
      ) {
        localStorage.removeItem(
          SUPER_ADMIN_KEY
        );
      }
    } catch {
      localStorage.removeItem(
        STORAGE_KEY
      );

      localStorage.removeItem(
        SUPER_ADMIN_KEY
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
  }, []);


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
        await response.json();

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

      setSuperAdmin(false);

      localStorage.removeItem(
        SUPER_ADMIN_KEY
      );

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


  const loginSuperAdmin =
    async (
      email: string,
      pin: string
    ) => {
      try {
        const cleanEmail =
          email
            .trim()
            .toLowerCase();

        const cleanPin =
          String(
            pin
          ).trim();


        if (
          !cleanEmail
        ) {
          return {
            error:
              'Super Admin email is required.',
          };
        }


        if (
          !/^\d{4}$/.test(
            cleanPin
          )
        ) {
          return {
            error:
              'Super Admin PIN must be 4 digits.',
          };
        }


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

                  pin:
                    cleanPin,
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
         * Store only the signed server token.
         *
         * Never store the PIN.
         */
        localStorage.setItem(
          SUPER_ADMIN_SESSION,
          String(
            result.token
          )
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


        localStorage.removeItem(
          SUPER_ADMIN_KEY
        );

        localStorage.removeItem(
          STORAGE_KEY
        );


        setUser(null);
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


  const register =
    async (
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
          await response.json();


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
          SUPER_ADMIN_KEY
        );

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
          JSON.parse(
            stored
          );

        if (
          parsed?.user
        ) {
          setUser(
            parsed.user
          );
        }
      } catch {
        localStorage.removeItem(
          STORAGE_KEY
        );

        setUser(null);
      }
    };


  const logout = () => {
    setUser(null);

    localStorage.removeItem(
      STORAGE_KEY
    );
  };


  const logoutSuperAdmin =
    () => {
      setSuperAdmin(false);

      localStorage.removeItem(
        SUPER_ADMIN_KEY
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION
      );

      localStorage.removeItem(
        SUPER_ADMIN_SESSION_EXPIRY
      );
    };


  const updateWalletBalance =
    (
      balance: number
    ) => {
      setUser(
        (prev) => {
          if (!prev) {
            return prev;
          }

          const updated = {
            ...prev,
            wallet_balance:
              balance,
          };

          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              user: updated,
            })
          );

          return updated;
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
