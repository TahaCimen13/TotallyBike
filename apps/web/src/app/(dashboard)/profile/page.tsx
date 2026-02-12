'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [rideCount, setRideCount] = useState(0);

  useEffect(() => {
    apiFetch<any[]>('/api/rides').then((res) => {
      if (res.success && res.data) setRideCount(res.data.length);
    });
  }, []);

  if (!user) return null;

  return (
    <div style={{ padding: '2rem', maxWidth: '500px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Profil</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ width: '4rem', height: '4rem', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto 1rem' }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user.email}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Bakiye</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{user.balance.toFixed(2)} TL</p>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Toplam Sürüş</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>{rideCount}</p>
          </div>
        </div>
      </div>

      <button className="btn btn-danger" style={{ width: '100%' }} onClick={logout}>
        Çıkış Yap
      </button>
    </div>
  );
}
