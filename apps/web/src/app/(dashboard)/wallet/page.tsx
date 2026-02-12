'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

const QUICK_AMOUNTS = [20, 50, 100];

export default function WalletPage() {
  const { balance, loading, fetchBalance, topup } = useWallet();
  const [customAmount, setCustomAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const handleTopup = async (amount: number) => {
    setTopupLoading(true);
    setMessage('');
    const res = await topup(amount);
    if (res.success) {
      setMessage(`${amount.toFixed(2)} TL yüklendi!`);
      setCustomAmount('');
    } else {
      setMessage(res.error || 'Yükleme başarısız');
    }
    setTopupLoading(false);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Cüzdan</h1>

      {/* Balance Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', color: 'white', marginBottom: '1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Güncel Bakiye</p>
        <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>
          {loading ? '...' : `${balance.toFixed(2)} TL`}
        </p>
      </div>

      {/* Quick Topup */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Hızlı Yükleme</h3>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={() => handleTopup(amount)}
              disabled={topupLoading}
            >
              {amount} TL
            </button>
          ))}
        </div>
      </div>

      {/* Custom Topup */}
      <div className="card">
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Özel Tutar</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="input"
            type="number"
            min="1"
            placeholder="Tutar (TL)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleTopup(Number(customAmount))}
            disabled={!customAmount || Number(customAmount) <= 0 || topupLoading}
          >
            Yükle
          </button>
        </div>
      </div>

      {message && (
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '0.5rem', background: '#f0fdf4', color: '#15803d', fontSize: '0.875rem', textAlign: 'center' }}>
          {message}
        </div>
      )}
    </div>
  );
}
