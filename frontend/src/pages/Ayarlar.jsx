/**
 * @file Ayarlar.jsx
 * @description Kullanıcının kişisel bilgilerini (ad-soyad, e-posta, telefon), şifresini,
 * sistem genelindeki profil verilerini güncellediği sayfadır.
 * Ek olarak kullanıcının güncel güven puanını (rating) ve Google Gmail API bağlantı durumunu gösterir.
 */
import React, { useState } from 'react';
import { Settings as SettingsIcon, User as Kullanici, Shield, Star, Key, Save } from 'lucide-react';
import { customFetch, BASE_URL } from '../services/apiIstemcisi';
import { useToast } from '../context/BildirimBaglami';

const Ayarlar = () => {
  const { showToast } = useToast();
  const storedUser = localStorage.getItem('user');
  const initialUser = storedUser ? JSON.parse(storedUser) : { id: '', ad_soyad: '', email: '', telefon: '', rol: 'USER', rating_puani: 5.0 };
  
  const [user, setUser] = useState(initialUser);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const isAdmin = user.rol === 'ADMIN';
 
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!user.ad_soyad.trim() || !user.email.trim()) {
      showToast("Ad Soyad ve E-posta alanları boş bırakılamaz.", "warning");
      return;
    }
    
    if (password && password !== confirmPassword) {
      showToast("Şifreler eşleşmiyor.", "warning");
      return;
    }
 
    setIsSaving(true);
    setMessage('');
    try {
      const payload = {
        ad_soyad: user.ad_soyad,
        email: user.email,
        telefon: user.telefon,
        rol: user.rol,
        tema_tercihi: localStorage.getItem('theme') || 'dark'
      };
      
      if (password) {
        payload.sifre = password;
      }
 
      const res = await customFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
 
      if (res.ok) {
        const updatedUser = await res.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        showToast("Profil bilgileri başarıyla güncellendi!", "success");
        setPassword('');
        setConfirmPassword('');
      } else {
        showToast("Profil güncellenirken sunucu hatası oluştu.", "error");
      }
    } catch (err) {
      console.error("Profil güncelleme hatası:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    } finally {
      setIsSaving(false);
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
          <SettingsIcon size={36} color="var(--accent-color)" /> Profil ve Ayarlar
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          Kişisel bilgilerinizi, güvenlik ayarlarınızı ve API entegrasyonlarınızı bu panelden yönetebilirsiniz.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'minmax(0, 820px)' : '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* Profile Update Form */}
        <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '32px', boxShadow: 'var(--card-shadow)' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            <Kullanici size={20} color="var(--accent-color)" /> Kişisel Bilgiler
          </h2>

          {message && (
            <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--accent-color)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '12px 16px', marginBottom: '20px', fontSize: '0.9rem', fontWeight: '600' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleProfileSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Ad Soyad</label>
                <input 
                  type="text" 
                  value={user.ad_soyad}
                  onChange={(e) => setUser({ ...user, ad_soyad: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Telefon Numarası</label>
                <input 
                  type="text" 
                  value={user.telefon || ''}
                  onChange={(e) => setUser({ ...user, telefon: e.target.value })}
                  placeholder="05xxxxxxxxx"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>E-posta Adresi</label>
              <input 
                type="email" 
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <Key size={18} color="var(--accent-color)" /> Şifre Değiştir (İsteğe Bağlı)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Yeni Şifre</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Yeni Şifre Tekrar</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                fontWeight: '700',
                padding: '12px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)',
                transition: 'all 0.2s',
                marginTop: '10px'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-hover)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-color)'}
            >
              <Save size={16} /> {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </form>
        </div>

        {/* YanMenu Info Cards */}
        {!isAdmin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Trust Score Rating Card */}
          <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Shield size={20} color="#eab308" /> Güven Puanı (Rating)
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '1.5rem', fontWeight: '800' }}>
                {user.rating_puani?.toFixed(1)}
              </div>
              <div>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={16} 
                      color={i < Math.round(user.rating_puani || 5.0) ? '#eab308' : '#cbd5e1'} 
                      fill={i < Math.round(user.rating_puani || 5.0) ? '#eab308' : 'none'} 
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  İmece gruplarına katılım durumunuza göre güncellenir.
                </span>
              </div>
            </div>
          </div>

          {/* Google Auth Integration Card */}
          <div style={{ backgroundColor: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '24px', boxShadow: 'var(--card-shadow)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Key size={20} color="#ef4444" /> Gmail API Bağlantısı
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '16px' }}>
              Siparişlerinizin ve kargolarınızın Gmail üzerinden otomatik izlenmesi için Google hesabınızı bağlamanız gereklidir.
            </p>
            {user.gmail_token ? (
              <div style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', fontWeight: '600' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Google API Bağlı
              </div>
            ) : (
              <a 
                href={`${BASE_URL}/oauth2/authorization/google`} 
                style={{
                  display: 'block',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #ef4444, #ea580c)',
                  color: '#fff',
                  fontWeight: '700',
                  padding: '12px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.2)',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Google Hesabını Yetkilendir
              </a>
            )}
          </div>

        </div>
        )}

      </div>
    </div>
  );
};

export default Ayarlar;
