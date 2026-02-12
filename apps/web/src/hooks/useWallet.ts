'use client';

import { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export function useWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    const res = await apiFetch<{ balance: number }>('/api/wallet/balance');
    if (res.success && res.data) {
      setBalance(res.data.balance);
    }
    setLoading(false);
  }, []);

  const topup = async (amount: number) => {
    const res = await apiFetch<{ balance: number }>('/api/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
    if (res.success && res.data) {
      setBalance(res.data.balance);
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  return { balance, loading, fetchBalance, topup };
}
