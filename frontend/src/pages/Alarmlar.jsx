/**
 * @file Alarmlar.jsx
 * @description Kullanıcının takip listesine eklediği ürünlerin hedef fiyat alarmlarını listeler.
 * Mevcut fiyat ile hedef fiyatı karşılaştırma, hedefe ulaşınca bildirim alma ve alarmları silme işlevlerini yönetir.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, Trash2, ExternalLink, TrendingDown } from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import { useConfirm } from '../components/OnayModali';
import { useToast } from '../context/BildirimBaglami';
import emptyAlarms from '../assets/illustrations/empty-alarms.svg';

const Alarmlar = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [alarms, setAlarms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;

  const fetchAlarms = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = userId
        ? `/api/alarms?kullaniciId=${userId}`
        : '/api/alarms';
      const res = await customFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlarms(data);
      }
    } catch (err) {
      console.error("Alarmlar yüklenirken hata:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  const handleDeleteAlarm = async (id) => {
    const isConfirmed = await confirm("Bu fiyat alarmını silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;
    try {
      const res = await customFetch(`/api/alarms/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setAlarms(alarms.filter(a => a.id !== id));
        showToast("Fiyat alarmı başarıyla silindi.", "success");
      } else {
        showToast("Alarm silinirken bir hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Alarm silinirken hata:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)', minHeight: '80vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: '800', 
          background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <BellRing size={36} color="var(--accent-color)" /> Fiyat Alarmlarım
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Takip listenizdeki ürünler hedeflediğiniz fiyata düştüğünde anlık olarak haberdar edilirsiniz.
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-color)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : alarms.length === 0 ? (
        <div className="os-empty-state" style={{ 
          backgroundColor: 'var(--surface-color)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '40px', 
          textAlign: 'center', 
          border: '1px dashed var(--border-color)',
          maxWidth: '600px',
          margin: '0 auto',
          boxShadow: 'var(--shadow-card)'
        }}>
          <img src={emptyAlarms} alt="" aria-hidden="true" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Aktif Alarm Bulunmuyor</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
            Karşılaştırma sayfasından beğendiğiniz ürünler için hedef fiyat belirleyerek ilk alarmınızı hemen oluşturabilirsiniz.
          </p>
          <a 
            href="/products" 
            style={{ 
              display: 'inline-block',
              background: 'var(--accent-color)',
              color: '#fff',
              fontWeight: '700',
              padding: '12px 24px',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--accent-hover)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'var(--accent-color)'}
          >
            Ürün Kıyaslamaya Git
          </a>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {alarms.map((alarm) => (
            <div 
              key={alarm.id} 
              style={{
                backgroundColor: 'var(--surface-color)',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--card-shadow)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--card-shadow-hover)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--card-shadow)'; }}
            >
              <button 
                onClick={() => handleDeleteAlarm(alarm.id)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: 'none',
                  color: '#ef4444',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                title="Alarmı Kaldır"
              >
                <Trash2 size={16} />
              </button>

              <div style={{ display: 'flex', gap: '16px' }}>
                <img 
                  src={alarm.resim_url || 'https://via.placeholder.com/150'} 
                  alt={alarm.urun_adi}
                  style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'contain', backgroundColor: '#fff', padding: '6px', border: '1px solid var(--border-color)' }}
                />
                <div style={{ flex: 1, paddingRight: '24px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--accent-color)', letterSpacing: '1px' }}>
                    {alarm.platform_adi}
                  </span>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '600', margin: '4px 0 8px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4', color: 'var(--text-primary)' }}>
                    {alarm.urun_adi}
                  </h4>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '12px', 
                backgroundColor: 'var(--bg-color)', 
                padding: '12px', 
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>Mevcut Fiyat</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {alarm.guncel_fiyat?.toLocaleString('tr-TR')} ₺
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'block' }}>Hedef Fiyat</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {alarm.hedef_fiyat?.toLocaleString('tr-TR')} ₺
                    <TrendingDown size={16} />
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <a 
                  href={alarm.urun_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '10px',
                    padding: '8px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                >
                  Ürüne Git <ExternalLink size={14} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alarmlar;
