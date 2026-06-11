/**
 * @file Iletisim.jsx
 * @description Kullanıcıların sistem yöneticilerine destek, hata bildirimleri veya öneri mesajları gönderebileceği,
 * gönderdiği geçmiş destek taleplerinin durumunu (Bekliyor, İnceleniyor, Çözüldü) takip edebileceği destek sayfasıdır.
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Mail, Send, CheckCircle, MessageSquare } from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import { useToast } from '../context/BildirimBaglami';

const Iletisim = () => {
  const { showToast } = useToast();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [formData, setFormData] = useState({
    ad_soyad: user?.ad_soyad || '',
    email: user?.email || '',
    konu: 'Hata Bildirimi',
    mesaj: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [supportRequests, setSupportRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const fetchSupportRequests = useCallback(async () => {
    if (!user?.id && !user?.email) return;
    setIsLoadingRequests(true);
    try {
      const query = user?.id
        ? `kullaniciId=${user.id}`
        : `email=${encodeURIComponent(user.email)}`;
      const res = await customFetch(`/api/support?${query}`);
      if (!res.ok) {
        throw new Error('Destek talepleri alınamadı.');
      }
      setSupportRequests(await res.json());
    } catch (err) {
      console.error("Destek talepleri yüklenemedi:", err);
    } finally {
      setIsLoadingRequests(false);
    }
  }, [user?.email, user?.id]);

  useEffect(() => {
    fetchSupportRequests();
  }, [fetchSupportRequests]);

  const getStatusLabel = (durum) => {
    const labels = {
      BEKLIYOR: 'Bekliyor',
      INCELENIYOR: 'İnceleniyor',
      COZULDU: 'Çözüldü'
    };
    return labels[durum || 'BEKLIYOR'] || 'Bekliyor';
  };

  const getStatusStyle = (durum) => {
    const status = durum || 'BEKLIYOR';
    if (status === 'COZULDU') {
      return { background: 'rgba(34, 197, 94, 0.14)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.22)' };
    }
    if (status === 'INCELENIYOR') {
      return { background: 'rgba(59, 130, 246, 0.14)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.22)' };
    }
    return { background: 'rgba(245, 158, 11, 0.14)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.22)' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestData = {
      ad_soyad: formData.ad_soyad.trim(),
      email: formData.email.trim(),
      konu: formData.konu.trim(),
      mesaj: formData.mesaj.trim(),
      kullanici: user?.id ? { id: user.id } : null
    };

    if (!requestData.ad_soyad || !requestData.email || !requestData.konu || !requestData.mesaj) {
      showToast("Lütfen tüm alanları doldurun.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (res.ok) {
        setIsSent(true);
        showToast("Destek talebiniz başarıyla gönderildi.", "success");
        setFormData({
          ad_soyad: user?.ad_soyad || '',
          email: user?.email || '',
          konu: 'Hata Bildirimi',
          mesaj: ''
        });
        await fetchSupportRequests();
      } else {
        const errorText = await res.text();
        showToast(errorText || "Bir hata oluştu, lütfen daha sonra tekrar deneyin.", "error");
      }
    } catch (err) {
      console.error("Destek talebi gönderilemedi:", err);
      showToast("Bir hata oluştu, lütfen daha sonra tekrar deneyin.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ color: 'var(--text-primary)', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '760px', width: '100%', backgroundColor: 'var(--surface-color)', borderRadius: '24px', border: '1px solid var(--border-color)', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)' }}>
        
        {isSent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle size={64} color="var(--accent-color)" style={{ marginBottom: '20px' }} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '12px', color: 'var(--text-primary)' }}>Mesajınız İletildi!</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '32px' }}>
              Destek ve iletişim talebiniz başarıyla sistem yöneticilerimize gönderilmiştir. En kısa sürede kayıtlı e-posta adresiniz üzerinden geri dönüş sağlanacaktır.
            </p>
            <button 
              onClick={() => setIsSent(false)}
              style={{
                background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                  color: '#fff',
                border: 'none',
                fontWeight: '600',
                padding: '12px 30px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Yeni Mesaj Gönder
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', backgroundColor: 'rgba(114, 191, 120, 0.1)', marginBottom: '16px' }}>
                <Mail size={36} color="var(--accent-color)" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                İletişim ve Destek
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                Sistem ile ilgili soru, öneri, şikayet veya hata bildirimlerinizi iletebilirsiniz.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Ad Soyad</label>
                <input 
                  type="text" 
                  value={formData.ad_soyad}
                  onChange={(e) => setFormData({ ...formData, ad_soyad: e.target.value })}
                  placeholder="Örn: Ahmet Yılmaz"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>E-posta Adresiniz</label>
                <input 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="ahmetyilmaz@gmail.com"
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Konu</label>
                <select 
                  value={formData.konu}
                  onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none' }}
                >
                  <option value="Hata Bildirimi">Hata Bildirimi</option>
                  <option value="Öneri / İstek">Öneri / İstek</option>
                  <option value="Üyelik Sorunları">Üyelik Sorunları</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Mesajınız</label>
                <textarea 
                  rows="4"
                  value={formData.mesaj}
                  onChange={(e) => setFormData({ ...formData, mesaj: e.target.value })}
                  placeholder="Mesajınızı detaylı şekilde buraya yazın..."
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '0.95rem', outline: 'none', transition: 'border 0.2s', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{
                  background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))',
                  color: '#fff',
                  border: 'none',
                  fontWeight: '700',
                  padding: '14px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(114, 191, 120, 0.4)',
                  transition: 'all 0.2s',
                  marginTop: '10px'
                }}
              >
                {isSubmitting ? 'Gönderiliyor...' : (
                  <>
                    Gönder <Send size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '34px', paddingTop: '26px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} /> Gönderdiğim Talepler
                  </h3>
                  <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Admin ekibi talebinizin durumunu değiştirdiğinde burada güncel halini görebilirsiniz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSupportRequests}
                  style={{ border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', fontWeight: 700 }}
                >
                  Yenile
                </button>
              </div>

              {isLoadingRequests ? (
                <p style={{ color: 'var(--text-secondary)' }}>Talepler yükleniyor...</p>
              ) : supportRequests.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Henüz gönderilmiş destek talebiniz yok.</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {supportRequests.map(request => (
                    <div key={request.id} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', padding: '16px', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                        <strong>{request.konu}</strong>
                        <span style={{ ...getStatusStyle(request.durum), borderRadius: '999px', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {getStatusLabel(request.durum)}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 8px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{request.mesaj}</p>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {request.olusturma_tarihi ? new Date(request.olusturma_tarihi).toLocaleString('tr-TR') : ''}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Iletisim;
