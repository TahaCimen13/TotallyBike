'use client';

import Link from 'next/link';
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/lib/auth';
export default function LandingPage() {
  const { user } = useAuth();
  const [showQR, setShowQR] = useState(false);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #ecfdf5 0%, #f9fafb 40%)' }}>
      {/* Header */}
      <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>TotallyBike</h1>
          <button
            onClick={() => setShowQR(!showQR)}
            style={{
              background: 'none', border: '1.5px solid var(--primary)', borderRadius: 6,
              padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            QR
          </button>
          <a
            href="/demo.html"
            target="_blank"
            style={{
              background: 'none', border: '1.5px solid var(--primary)', borderRadius: 6,
              padding: '0.25rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: '0.35rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)',
              textDecoration: 'none',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Demo
          </a>
        </div>

        {/* QR Popup */}
        {showQR && (
          <>
            <div onClick={() => setShowQR(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 99 }} />
            <div style={{
              position: 'absolute', top: 60, left: '2rem', zIndex: 100,
              background: 'white', borderRadius: 16, padding: '1.5rem',
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)', textAlign: 'center', width: 240,
            }}>
              <p style={{ fontWeight: 700, marginBottom: '0.25rem', fontSize: '0.95rem' }}>Örnek Bisiklet QR</p>
              <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: '1rem' }}>Mobil uygulamadan tarayın</p>
              <QRCodeSVG
                value="KUZEY-BIKE-001"
                size={180}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
                style={{ margin: '0 auto' }}
              />
              <p style={{ fontSize: '0.7rem', color: '#aaa', marginTop: '0.75rem', fontFamily: 'monospace' }}>KUZEY-BIKE-001</p>
            </div>
          </>
        )}
        <nav style={{ display: 'flex', gap: '0.75rem' }}>
{user ? (
            <Link href="/map" className="btn btn-primary">Haritaya Git</Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-outline">Giriş Yap</Link>
              <Link href="/register" className="btn btn-primary">Kayıt Ol</Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          <span role="img" aria-label="bike">&#x1F6B2;</span>
        </div>
        <h2 style={{ fontSize: '2.75rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.15, maxWidth: '700px' }}>
          Kampüs İçi Elektrikli Bisiklet Paylaşım Platformu
        </h2>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', maxWidth: '550px', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          QR kodu okut, pedala bas, git! İstasyonlar arası hızlı, çevreci ve uygun fiyatlı ulaşım.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/register" className="btn btn-primary" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Hemen Başla
          </Link>
          <a href="#nasil-calisir" className="btn btn-outline" style={{ padding: '0.875rem 2rem', fontSize: '1rem' }}>
            Nasıl Çalışır?
          </a>
        </div>
      </section>

      {/* Stats Bar */}
      <section style={{ background: 'var(--primary)', color: 'white', padding: '2rem 0' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          {[
            { value: '4', label: 'İstasyon' },
            { value: '19', label: 'Bisiklet' },
            { value: '15 dk', label: 'Ücretsiz Süre' },
            { value: '0.50 TL/dk', label: 'Sonrası' },
          ].map((stat) => (
            <div key={stat.label}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: '0.875rem', opacity: 0.85 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="nasil-calisir" style={{ padding: '4rem 2rem', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '2.5rem' }}>Nasıl Çalışır?</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { step: '1', title: 'Kayıt Ol', desc: 'Hesap oluştur, bakiyeni yükle ve kampüste bisiklet kullanmaya başla.', icon: '&#x1F4F1;' },
            { step: '2', title: 'İstasyon Seç', desc: 'Haritadan en yakın istasyonu bul, müsait bisikletleri gör.', icon: '&#x1F4CD;' },
            { step: '3', title: 'Bisiklet Kirala', desc: 'Beğendiğin bisikleti seç, kilidi aç ve yola çık!', icon: '&#x1F513;' },
            { step: '4', title: 'Sürüşü Bitir', desc: 'Herhangi bir istasyona bisikleti bırak. İlk 15 dk ücretsiz!', icon: '&#x2705;' },
          ].map((item) => (
            <div key={item.step} className="card" style={{ width: '200px', textAlign: 'center', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }} dangerouslySetInnerHTML={{ __html: item.icon }} />
              <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', fontSize: '0.875rem', fontWeight: 700 }}>
                {item.step}
              </div>
              <h4 style={{ marginBottom: '0.5rem' }}>{item.title}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', lineHeight: 1.5 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding: '3rem 2rem', background: '#f3f4f6' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '2rem', fontWeight: 700, textAlign: 'center', marginBottom: '2rem' }}>Fiyatlandırma</h3>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>Kilit Açma Ücreti</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Her sürüş başlangıcında</div>
                </div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>5.00 TL</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>İlk 15 Dakika</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kilit açma ücretine dahil</div>
                </div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>Ücretsiz</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>15 dk Sonrası</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Her dakika için</div>
                </div>
                <strong style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>0.50 TL</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>Hemen Başla!</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Hesap oluştur, bakiye yükle ve kampüste özgürce bisiklet sür.</p>
        <Link href="/register" className="btn btn-primary" style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}>
          Ücretsiz Kayıt Ol
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        TotallyBike - PISI BikeApp &copy; 2026
      </footer>
    </div>
  );
}
