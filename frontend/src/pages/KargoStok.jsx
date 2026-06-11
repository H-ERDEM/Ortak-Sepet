/**
 * @file KargoStok.jsx
 * @description Gmail Canlı Kargo ve Sipariş takip merkezidir. Google OAuth2 bağlantısı kurulduktan sonra
 * kullanıcının e-postalarını tarayıp kargo kayıtlarını oluşturur/günceller, durumları görsel bir progress barda listeler,
 * ve teslim alınan kargoları tek tıkla Stok Envanterine aktarmayı sağlar.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, RefreshCw, MailCheck, Trash2, Plus, Sparkles, CheckCircle2, Archive } from 'lucide-react';
import { customFetch, BASE_URL } from '../services/apiIstemcisi';
import { useConfirm } from '../components/OnayModali';
import { useToast } from '../context/BildirimBaglami';
import '../styles/Urunler.css';

const KargoStok = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const [cargos, setCargos] = useState([]);
  const [isGmailConnected, setIsGmailConnected] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCargo, setNewCargo] = useState({
    urun_adi: '',
    kargo_takip_no: '',
    kargo_durumu: 'Hazırlanıyor'
  });

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;

  // Modal State for importing cargo to stock
  const [selectedCargoForStock, setSelectedCargoForStock] = useState(null);
  const [stockImportData, setStockImportData] = useState({
    urun_adi: '',
    kategori: 'Market',
    miktar: 1,
    kritik_esik: 2
  });

  const categories = ['Temizlik', 'Market', 'Kozmetik', 'Gıda', 'Diğer'];

  const googleConnectUrl = `${BASE_URL}/api/cargos/google/connect?userId=${userId || ''}&redirect=${encodeURIComponent(`${window.location.origin}/cargo?success=true`)}`;

  // Fetch cargos & gmail status
  const fetchData = useCallback(async () => {
    try {
      const url = userId ? `/api/cargos?kullaniciId=${userId}` : '/api/cargos';
      const resCargos = await customFetch(url);
      if (resCargos.ok) {
        const data = await resCargos.json();
        setCargos(data);
      }

      const resGmail = await customFetch(`/api/cargos/status?kullaniciId=${userId || ''}`);
      if (resGmail.ok) {
        const data = await resGmail.json();
        setIsGmailConnected(data.connected);
      }
    } catch (err) {
      console.error("Veri çekilemedi:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCargo = async (e) => {
    e.preventDefault();
    if (!newCargo.urun_adi.trim()) return;

    try {
      const res = await customFetch('/api/cargos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCargo,
          kullanici: user ? { id: user.id } : null
        })
      });
      if (res.ok) {
        setNewCargo({ urun_adi: '', kargo_takip_no: '', kargo_durumu: 'Hazırlanıyor' });
        setShowAddForm(false);
        showToast("Kargo takibi başarıyla eklendi.", "success");
        fetchData();
      } else {
        showToast("Kargo eklenirken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Kargo ekleme hatası:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleDeleteCargo = async (id) => {
    const isConfirmed = await confirm("Bu kargo kaydını silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;
    try {
      const res = await customFetch(`/api/cargos/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast("Kargo kaydı başarıyla silindi.", "success");
        fetchData();
      } else {
        showToast("Kargo silinirken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Silme hatası:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  const handleSyncGmail = async () => {
    setIsSyncing(true);
    setSyncLogs([]);
    try {
      const res = await customFetch(`/api/cargos/sync?kullaniciId=${userId || ''}`);
      if (res.ok) {
        const logs = await res.json();
        setSyncLogs(logs);

        // Bulunan e-posta sayısını al ve localStorage'a kaydet (kullanıcıya özel)
        if (logs && logs.length > 0) {
          const firstLog = logs[0];
          const match = firstLog.match(/Bulunan e-posta sayısı:\s*(\d+)/i);
          if (match) {
            const count = parseInt(match[1], 10);
            localStorage.setItem(`gmailSyncCount_${userId || ''}`, count);
          }
        }

        showToast("Gmail senkronizasyonu tamamlandı.", "success");
        fetchData();
      } else {
        showToast("Senkronizasyon başarısız oldu.", "error");
      }
    } catch (err) {
      setSyncLogs(["Gmail senkronizasyonu sırasında ağ hatası oluştu."]);
      showToast("Bağlantı hatası oluştu.", "error");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectGmail = async () => {
    try {
      const res = await customFetch(`/api/cargos/google/disconnect?userId=${userId || ''}`, {
        method: 'POST'
      });
      if (res.ok) {
        setIsGmailConnected(false);
        showToast("Google bağlantısı başarıyla kesildi.", "success");
        setSyncLogs([]);
      } else {
        showToast("Bağlantı kesilirken bir hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Bağlantı kesme hatası:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  // Open import modal
  const openImportModal = (cargo) => {
    setSelectedCargoForStock(cargo);
    setStockImportData({
      urun_adi: cargo.urun_adi,
      kategori: 'Market',
      miktar: 1,
      kritik_esik: 2
    });
  };

  // Submit import to stock
  const handleImportToStock = async (e) => {
    e.preventDefault();
    try {
      const res = await customFetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urun_adi: stockImportData.urun_adi,
          kategori: stockImportData.kategori,
          miktar: stockImportData.miktar,
          kritik_esik: stockImportData.kritik_esik,
          kullanici: user ? { id: user.id } : null
        })
      });
      if (res.ok) {
        // Delete cargo as it has been imported to stock
        await customFetch(`/api/cargos/${selectedCargoForStock.id}`, {
          method: 'DELETE'
        });
        showToast("Ürün başarıyla stok listesine eklendi ve kargo kaydı güncellendi!", "success");
        setSelectedCargoForStock(null);
        fetchData(); // Refresh the cargo list
      } else {
        showToast("Ürün stoka eklenirken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Stoka aktarma hatası:", err);
      showToast("Bağlantı hatası oluştu.", "error");
    }
  };

  const syncReport = useMemo(() => {
    const report = {
      totalEmails: null,
      processed: [],
      updates: [],
      created: [],
      unchanged: [],
      errors: []
    };

    syncLogs.forEach((log) => {
      const emailMatch = log.match(/Bulunan e-posta sayısı:\s*(\d+)/i);
      if (emailMatch) {
        report.totalEmails = Number(emailMatch[1]);
        return;
      }

      if (log.startsWith('İşleniyor:')) {
        const subjectMatch = log.match(/Konu:\s*'([^']*)'/i);
        const snippetMatch = log.match(/Snippet:\s*(.*)$/i);
        report.processed.push({
          subject: subjectMatch?.[1] || 'Konu bulunamadı',
          snippet: snippetMatch?.[1] || ''
        });
        return;
      }

      if (log.startsWith('GÜNCELLENDİ')) {
        report.updates.push(log);
        return;
      }

      if (log.startsWith('YENİ KARGO EKLENDİ')) {
        report.created.push(log);
        return;
      }

      if (log.startsWith('Durum Değişmedi')) {
        report.unchanged.push(log);
        return;
      }

      report.errors.push(log);
    });

    return report;
  }, [syncLogs]);

  return (
    <div className="products-page" style={{ color: 'var(--text-primary)', minHeight: '80vh' }}>
      <div className="search-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Package size={36} color="var(--accent-color)" /> Canlı Kargo Takip Merkezi
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Sipariş ettiğiniz ürünlerin kargo aşamalarını canlı Gmail API entegrasyonuyla otomatik takip edin. Teslim edilen ürünleri tek tıkla stoka aktarın.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
        
        {/* Main Content Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Action Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>Kargo Siparişleri</h2>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                background: 'var(--accent-color)',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 15px rgba(30, 108, 47, 0.15)',
                transition: 'all 0.3s ease'
              }}
            >
              <Plus size={18} /> Yeni Takip Kodu Ekle
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <form onSubmit={handleAddCargo} style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr',
              gap: '16px',
              alignItems: 'end',
              boxShadow: 'var(--card-shadow)'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ürün / Sipariş Adı</label>
                <input 
                  type="text" 
                  placeholder="Örn: Trendyol Kozmetik Paketi"
                  required
                  value={newCargo.urun_adi}
                  onChange={(e) => setNewCargo({ ...newCargo, urun_adi: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Kargo Takip No</label>
                <input 
                  type="text" 
                  placeholder="Örn: 27731234"
                  required
                  value={newCargo.kargo_takip_no}
                  onChange={(e) => setNewCargo({ ...newCargo, kargo_takip_no: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Kargo Durumu</label>
                <select
                  value={newCargo.kargo_durumu}
                  onChange={(e) => setNewCargo({ ...newCargo, kargo_durumu: e.target.value })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                >
                  <option value="Hazırlanıyor" style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>Hazırlanıyor</option>
                  <option value="Kargoya Verildi / Yolda" style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>Kargoya Verildi / Yolda</option>
                  <option value="Teslim Edildi" style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>Teslim Edildi</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 3', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '8px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Vazgeç</button>
                <button type="submit" style={{ padding: '8px 20px', borderRadius: '10px', background: 'var(--accent-color)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Ekle</button>
              </div>
            </form>
          )}

          {/* Kargo List Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cargos.length === 0 ? (
              <div style={{
                background: 'var(--surface-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                <Package size={48} style={{ marginBottom: '12px', opacity: 0.5, color: 'var(--accent-color)' }} />
                <h3 style={{ color: 'var(--text-primary)' }}>Aktif kargo takibi bulunmuyor.</h3>
                <p>Gmail senkronizasyonunu başlatarak veya manuel kargo ekleyerek takip etmeye başlayın.</p>
              </div>
            ) : (
              cargos.map((item) => (
                <div key={item.id} style={{
                  background: 'var(--surface-color)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  boxShadow: 'var(--card-shadow)'
                }}>
                  {/* Item Row 1 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: '16px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '600', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {item.urun_adi}
                      </h3>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                        Takip Kodu: {item.kargo_takip_no}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Add to Stok Button (Visible on all, particularly useful on Deliveries) */}
                      <button 
                        onClick={() => openImportModal(item)}
                        style={{
                          background: 'rgba(114, 191, 120, 0.1)',
                          border: '1px solid rgba(114, 191, 120, 0.3)',
                          color: 'var(--accent-color)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.currentTarget.style.background = 'var(--accent-color)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(114, 191, 120, 0.1)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                      >
                        <Archive size={14} /> Stoka Ekle
                      </button>

                      <button 
                        onClick={() => handleDeleteCargo(item.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', borderRadius: '8px', transition: 'all 0.2s' }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--danger-color)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Progress visual representation */}
                  <div style={{ background: 'var(--bg-color)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>Kargo Durumu: <strong style={{ color: item.kargo_durumu === 'Teslim Edildi' ? 'var(--accent-color)' : 'var(--accent-hover)' }}>{item.kargo_durumu}</strong></span>
                    </div>
                    {/* Progress visual bar */}
                    <div style={{ display: 'flex', gap: '4px', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ flex: 1, background: 'var(--accent-color)', opacity: 1 }} />
                      <div style={{ flex: 1, background: 'var(--accent-color)', opacity: (item.kargo_durumu === 'Kargoya Verildi / Yolda' || item.kargo_durumu === 'Teslim Edildi') ? 1 : 0.2 }} />
                      <div style={{ flex: 1, background: 'var(--accent-color)', opacity: item.kargo_durumu === 'Teslim Edildi' ? 1 : 0.2 }} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* YanMenu Controls (Gmail Connection Details) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Gmail API Card */}
          <div style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: 'var(--card-shadow)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <MailCheck size={20} color="var(--accent-color)" /> Google Entegrasyonu
            </h3>
            <p style={{ margin: '0 0 16px 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Gmail içindeki kargo ve sipariş e-postalarını tarar, takip kodu yakalarsa kargo listenize işler.
            </p>

            {isGmailConnected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  background: 'rgba(114, 191, 120, 0.08)',
                  border: '1px solid rgba(114, 191, 120, 0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--accent-color)',
                  fontSize: '0.9rem'
                }}>
                  <CheckCircle2 size={18} /> Gmail Hesabı Bağlandı
                </div>

                <button 
                  onClick={handleSyncGmail}
                  disabled={isSyncing}
                  style={{
                    width: '100%',
                    background: 'var(--accent-color)',
                    color: '#fff',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(30, 108, 47, 0.15)',
                    transition: 'all 0.2s'
                  }}
                >
                  <RefreshCw size={18} className={isSyncing ? 'spin' : ''} /> {isSyncing ? 'E-postalar taranıyor...' : 'Gmail Senkronize Et'}
                </button>

                <button 
                  onClick={handleDisconnectGmail}
                  disabled={isSyncing}
                  style={{
                    width: '100%',
                    background: 'transparent',
                    color: 'var(--danger-color)',
                    border: '1px solid var(--danger-color)',
                    padding: '10px',
                    borderRadius: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s',
                    marginTop: '4px'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--danger-color)'; e.currentTarget.style.color = '#fff'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--danger-color)'; }}
                >
                  Bağlantıyı Kes
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  E-postalarınız üzerinden gelen otomatik sipariş ve teslimat maillerini sisteme aktarmak için Gmail hesabınızı bağlayın.
                </p>
                <a 
                  href={googleConnectUrl}
                  style={{
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    background: 'var(--bg-color)',
                    color: 'var(--text-primary)',
                    padding: '12px',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '0.9rem',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'all 0.2s',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <Sparkles size={18} color="#f59e0b" /> Google Hesabını Bağla
                </a>
              </div>
            )}
          </div>

          {/* Sync Report */}
          {syncLogs.length > 0 && (
            <div style={{
              background: 'var(--surface-color)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              padding: '18px',
              boxShadow: 'var(--card-shadow)'
            }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MailCheck size={17} color="var(--accent-color)" /> Gmail Tarama Özeti
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {[
                  { label: 'Bulunan e-posta', value: syncReport.totalEmails ?? syncReport.processed.length },
                  { label: 'Yeni kargo', value: syncReport.created.length },
                  { label: 'Güncellenen', value: syncReport.updates.length },
                  { label: 'Değişmeyen', value: syncReport.unchanged.length }
                ].map(item => (
                  <div key={item.label} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '12px' }}>
                    <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '1.25rem' }}>{item.value}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 700 }}>{item.label}</span>
                  </div>
                ))}
              </div>

              {(syncReport.created.length > 0 || syncReport.updates.length > 0 || syncReport.errors.length > 0) && (
                <div style={{ display: 'grid', gap: '8px', marginBottom: '14px' }}>
                  {[...syncReport.created, ...syncReport.updates, ...syncReport.errors].map((log, index) => (
                    <div key={`${log}-${index}`} style={{
                      background: log.includes('Hata') || log.includes('error') || log.includes('api') || log.includes('token') || log.toLowerCase().includes('forbidden') ? 'rgba(239, 68, 68, 0.08)' : 'var(--accent-light)',
                      border: `1px solid ${log.includes('Hata') || log.includes('error') || log.includes('api') || log.includes('token') || log.toLowerCase().includes('forbidden') ? 'rgba(239, 68, 68, 0.18)' : 'rgba(22, 163, 74, 0.18)'}`,
                      color: log.includes('Hata') || log.includes('error') || log.includes('api') || log.includes('token') || log.toLowerCase().includes('forbidden') ? 'var(--danger-color)' : 'var(--accent-color)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      lineHeight: 1.45,
                      wordBreak: 'break-word'
                    }}>
                      {log}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
                {syncReport.processed.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    İşlenen e-posta detayı bulunamadı.
                  </p>
                ) : (
                  syncReport.processed.map((item, index) => (
                    <article key={`${item.subject}-${index}`} style={{
                      background: 'var(--surface-muted)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '12px',
                      display: 'grid',
                      gap: '6px'
                    }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '0.86rem', lineHeight: 1.35 }}>
                        {item.subject}
                      </strong>
                      <p style={{
                        margin: 0,
                        color: 'var(--text-secondary)',
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {item.snippet || 'Önizleme metni yok.'}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* IMPORT TO STOCK DIALOG / MODAL */}
      {selectedCargoForStock && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form onSubmit={handleImportToStock} style={{
            background: 'var(--surface-color)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            width: '450px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--card-shadow-hover)'
          }}>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Archive size={20} /> Ürünü Stok Envanterine Ekle
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Kargo paketindeki ürünü kişisel stoğunuza eklemek için detayları girin.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Ürün Adı</label>
              <input 
                type="text" 
                required
                value={stockImportData.urun_adi}
                onChange={(e) => setStockImportData({ ...stockImportData, urun_adi: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Stok Kategorisi</label>
              <select
                value={stockImportData.kategori}
                onChange={(e) => setStockImportData({ ...stockImportData, kategori: e.target.value })}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Miktar</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={stockImportData.miktar}
                  onChange={(e) => setStockImportData({ ...stockImportData, miktar: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Kritik Limit</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={stockImportData.kritik_esik}
                  onChange={(e) => setStockImportData({ ...stockImportData, kritik_esik: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setSelectedCargoForStock(null)} style={{ padding: '8px 16px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}>Vazgeç</button>
              <button type="submit" style={{ padding: '8px 20px', borderRadius: '10px', background: 'var(--accent-color)', border: 'none', color: '#fff', fontWeight: '600', cursor: 'pointer' }}>Stoka Ekle</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default KargoStok;
