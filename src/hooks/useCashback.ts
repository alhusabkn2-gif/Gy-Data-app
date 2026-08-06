import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export interface CashbackSettings {
  is_enabled: boolean;
  allow_transfer_to_wallet: boolean;
  data_percent: number;
  airtime_percent: number;
  electricity_percent: number;
  cable_percent: number;
  betting_percent: number;
  waec_percent: number;
  jamb_percent: number;
  smile_percent: number;
  internet_percent: number;
}

const SERVICE_PERCENT_KEY: Record<string, keyof CashbackSettings> = {
  data: 'data_percent',
  airtime: 'airtime_percent',
  electricity: 'electricity_percent',
  cable: 'cable_percent',
  betting: 'betting_percent',
  waec: 'waec_percent',
  jamb: 'jamb_percent',
  smile: 'smile_percent',
  internet: 'internet_percent',
};

export function useCashback() {
  const { user, refreshUser } = useAuth();
  const [settings, setSettings] = useState<CashbackSettings | null>(null);
  const [cashbackBalance, setCashbackBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from('cashback_settings').select('*').limit(1).single();
    if (data) setSettings(data as CashbackSettings);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('cashback_balance')
      .eq('phone', user.phone)
      .maybeSingle();
    if (data) setCashbackBalance(parseFloat(data.cashback_balance) || 0);
  }, [user]);

  useEffect(() => {
    fetchSettings();
    fetchBalance();
    setLoading(false);
  }, [fetchSettings, fetchBalance]);

  const getCashbackPercent = useCallback(
    (service: string, productCashbackPercent?: number): number => {
      if (!settings || !settings.is_enabled) return 0;
      if (productCashbackPercent !== undefined && productCashbackPercent > 0) {
        return productCashbackPercent;
      }
      const key = SERVICE_PERCENT_KEY[service];
      return key ? settings[key] : 0;
    },
    [settings],
  );

  const calculateCashback = useCallback(
    (amount: number, service: string, productCashbackPercent?: number): number => {
      const percent = getCashbackPercent(service, productCashbackPercent);
      return Math.round(((amount * percent) / 100) * 100) / 100;
    },
    [getCashbackPercent],
  );

  const creditCashback = useCallback(
    async (params: {
      transactionId?: string;
      transactionReference?: string;
      service: string;
      product: string;
      transactionAmount: number;
      cashbackPercent: number;
    }): Promise<{ cashbackAmount: number; error: string | null }> => {
      if (!user) return { cashbackAmount: 0, error: 'Not authenticated' };
      if (!settings || !settings.is_enabled) return { cashbackAmount: 0, error: null };
      const cashbackAmount = Math.round(
        ((params.transactionAmount * params.cashbackPercent) / 100) * 100,
      ) / 100;
      if (cashbackAmount <= 0) return { cashbackAmount: 0, error: null };

      const { error: insertError } = await supabase
        .from('cashback_transactions')
        .insert({
          user_phone: user.phone,
          transaction_id: params.transactionId || null,
          transaction_reference: params.transactionReference || null,
          service: params.service,
          product: params.product,
          transaction_amount: params.transactionAmount,
          cashback_percent: params.cashbackPercent,
          cashback_amount: cashbackAmount,
          status: 'success',
        });
      if (insertError) return { cashbackAmount: 0, error: insertError.message };

      const newBalance = (user.cashback_balance || 0) + cashbackAmount;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cashback_balance: newBalance, updated_at: new Date().toISOString() })
        .eq('phone', user.phone);
      if (updateError) return { cashbackAmount: 0, error: updateError.message };

      setCashbackBalance(newBalance);
      await refreshUser();
      return { cashbackAmount, error: null };
    },
    [user, settings, refreshUser],
  );

  const transferToWallet = useCallback(
    async (amount: number): Promise<{ error: string | null }> => {
      if (!user) return { error: 'Not authenticated' };
      if (!settings || !settings.allow_transfer_to_wallet) return { error: 'Transfer not enabled' };
      if (amount <= 0) return { error: 'Invalid amount' };
      if (amount > (user.cashback_balance || 0)) return { error: 'Insufficient cashback balance' };

      const newCashback = (user.cashback_balance || 0) - amount;
      const newWallet = (user.wallet_balance || 0) + amount;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          cashback_balance: newCashback,
          wallet_balance: newWallet,
          updated_at: new Date().toISOString(),
        })
        .eq('phone', user.phone);
      if (profileError) return { error: profileError.message };

      await refreshUser();
      setCashbackBalance(newCashback);
      return { error: null };
    },
    [user, settings, refreshUser],
  );

  return {
    settings,
    cashbackBalance,
    loading,
    getCashbackPercent,
    calculateCashback,
    creditCashback,
    transferToWallet,
    refresh: () => { fetchSettings(); fetchBalance(); },
  };
}
