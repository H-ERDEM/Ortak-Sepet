/**
 * @file GrupDetayi.jsx
 * @description İmece grubunun detaylı yönetim sayfasıdır. Ortak sepet listesini, ürün ekleme/çıkarma işlemlerini,
 * grup içi anlık sohbet panelini, lider kontrol kartını (IBAN ekleme, ödemeleri onaylama, cezalandırma, grubu tamamen silme)
 * ve grubun aktiflik durumunu (`AKTIF`, `ODEME_BEKLENIYOR` vb.) yöneten arayüzü barındırır.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Clipboard, Plus, Users, MapPin, Star, AlertCircle, Check, 
  ExternalLink, MessageSquare, Send, ShieldAlert, X, Navigation, ArrowLeft, Trash2 
} from 'lucide-react';
import { 
  getGroup, addProductToGroup, updateGroupStatus, penalizeUser,
  updateGroupIban, getGroupChat, sendGroupChatMessage,
  removeProductFromGroup, deleteGroup
} from '../services/grupServisi';
import { searchProducts } from '../services/urunServisi';
import { useConfirm } from '../components/OnayModali';
import { useToast } from '../context/BildirimBaglami';
import '../styles/GrupDetayi.css';

const GrupDetayi = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : { id: 1, ad_soyad: 'Kullanıcı', rating_puani: 5.0 };

  // if navigated here with prefilled group (from create flow), use it immediately to avoid race
  const initialGroupFromState = (location && location.state && location.state.group) ? location.state.group : null;
  const [group, setGroup] = useState(initialGroupFromState);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Add product state
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const [directTitle, setDirectTitle] = useState('');
  const [directPrice, setDirectPrice] = useState('');
  const [directPlatform, setDirectPlatform] = useState('Trendyol');
  const [quantity, setQuantity] = useState(1);

  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // IBAN State
  const [iban, setIban] = useState('TR00 0000 0000 0000 0000 0000 00');
  const [isEditingIban, setIsEditingIban] = useState(false);

  const fetchGroupDetails = useCallback(async () => {
    try {
      const data = await getGroup(id);
      setGroup(data);
      if (data.iban) {
        setIban(data.iban);
      }
    } catch (error) {
      console.error('Grup detayları alınamadı:', error);
      setErrorMessage('Grup bulunamadı veya bu gruba erişim izniniz yok.');
    }
  }, [id]);

  const fetchChatMessages = useCallback(async () => {
    try {
      const msgs = await getGroupChat(id);
      setChatMessages(msgs);
    } catch (error) {
      console.error('Mesajlar çekilemedi:', error);
    }
  }, [id]);

  useEffect(() => {
    // If we have an initial group provided via navigation state, show it immediately to avoid empty-cart UX.
    // Then schedule a delayed fetch to refresh data (in case backend persistence was still in progress).
    if (initialGroupFromState) {
      // show prefilled group immediately (already set via useState initialization)
      // schedule one refresh shortly after navigation to pick up server-side persistence
      const refreshTimer = setTimeout(() => {
        fetchGroupDetails();
      }, 600); // 600ms delay

      const interval = setInterval(() => {
        fetchChatMessages();
      }, 4000);

      return () => {
        clearTimeout(refreshTimer);
        clearInterval(interval);
      };
    }

    // No initial group provided — fetch immediately
    fetchGroupDetails();
    fetchChatMessages();
    const interval = setInterval(() => {
      fetchChatMessages();
    }, 4000); // Poll chat messages every 4s
    return () => clearInterval(interval);
  }, [fetchGroupDetails, fetchChatMessages, initialGroupFromState]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleCopyInviteCode = () => {
    if (!group) return;
    navigator.clipboard.writeText(group.inviteCode);
    setSuccessMessage('Davet kodu panoya kopyalandı!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleStatusChange = async (newStatus) => {
    setErrorMessage('');
    try {
      const updated = await updateGroupStatus(group.id, currentUser.id, newStatus);
      setGroup(updated);
      setSuccessMessage(`Grup durumu başarıyla güncellendi: ${newStatus}`);
      
      // Post system message in chat
      postSystemMessage(`Grup durumu "${newStatus}" olarak güncellendi.`);
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Durum güncellenemedi.');
    }
  };

  const handlePenalizeUser = async (targetUserId, targetName) => {
    const isConfirmed = await confirm(`${targetName} adlı kullanıcıya gruptan çekildiği için ceza puanı (-0.5) vermek istediğinize emin misiniz?`);
    if (!isConfirmed) return;
    setErrorMessage('');
    try {
      await penalizeUser(group.id, currentUser.id, targetUserId);
      showToast(`${targetName} başarıyla cezalandırıldı.`, "success");
      setSuccessMessage(`${targetName} başarıyla cezalandırıldı (rating puanı düşürüldü).`);
      
      postSystemMessage(`${targetName} lider tarafından kurallara uymadığı için raporlandı (-0.5 Puan).`);
      
      fetchGroupDetails();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errMsg = error.response?.data || 'Cezalandırma işlemi başarısız.';
      setErrorMessage(errMsg);
      showToast(errMsg, "error");
    }
  };

  const postSystemMessage = async (text) => {
    try {
      const messageDto = {
        senderId: 0,
        senderName: 'Sistem',
        text: text,
        isSystem: true
      };
      await sendGroupChatMessage(id, messageDto);
      fetchChatMessages();
    } catch (error) {
      console.error('Sistem mesajı gönderilemedi:', error);
    }
  };

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const messageDto = {
        senderId: currentUser.id,
        senderName: currentUser.ad_soyad,
        text: newMessage,
        isSystem: false
      };
      await sendGroupChatMessage(id, messageDto);
      setNewMessage('');
      fetchChatMessages();
    } catch (error) {
      console.error('Mesaj gönderilemedi:', error);
    }
  };

  const handleSearchProduct = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchProducts(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Ürün arama hatası:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddScrapedProduct = async (product) => {
    setErrorMessage('');
    try {
      const productDto = {
        urunAdi: product.urun_adi,
        guncelFiyat: product.guncel_fiyat,
        urunUrl: product.urun_url,
        resimUrl: product.resim_url,
        platformAdi: product.platform_adi,
        miktar: quantity
      };
      const updatedGroup = await addProductToGroup(group.id, productDto, currentUser.id);
      setGroup(updatedGroup);
      setShowAddModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setQuantity(1);
      setSuccessMessage('Ürün başarıyla gruba eklendi!');
      postSystemMessage(`${currentUser.ad_soyad}, sepete "${product.urun_adi}" ekledi.`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Ürün sepete eklenemedi.');
    }
  };

  const handleAddDirectProduct = async (e) => {
    e.preventDefault();
    if (!directUrl || !directTitle || !directPrice) return;
    setErrorMessage('');
    try {
      const productDto = {
        urunAdi: directTitle,
        guncelFiyat: directPrice ? parseFloat(String(directPrice).replace(',', '.')) : 0.0,
        urunUrl: directUrl,
        resimUrl: 'https://via.placeholder.com/150',
        platformAdi: directPlatform,
        miktar: quantity
      };
      const updatedGroup = await addProductToGroup(group.id, productDto, currentUser.id);
      setGroup(updatedGroup);
      setShowAddModal(false);
      setDirectUrl('');
      setDirectTitle('');
      setDirectPrice('');
      setQuantity(1);
      setSuccessMessage('Ürün başarıyla gruba eklendi!');
      postSystemMessage(`${currentUser.ad_soyad}, sepete "${directTitle}" ekledi.`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Ürün sepete eklenemedi. Lütfen URL bağlantısının geçerli Trendyol/Hepsiburada/Google Shopping linki olduğunu kontrol edin.');
    }
  };

  const saveIban = async () => {
    try {
      const updatedGroup = await updateGroupIban(group.id, currentUser.id, iban);
      setGroup(updatedGroup);
      setIsEditingIban(false);
      postSystemMessage(`Lider ödeme IBAN adresini güncelledi.`);
    } catch (error) {
      console.error('IBAN güncellenemedi:', error);
      setErrorMessage('IBAN güncellenemedi.');
    }
  };

  const handleRemoveProduct = async (productId) => {
    const isConfirmed = await confirm("Bu ürünü sepetten silmek istediğinize emin misiniz?");
    if (!isConfirmed) return;
    setErrorMessage('');
    try {
      const updatedGroup = await removeProductFromGroup(group.id, productId, currentUser.id);
      setGroup(updatedGroup);
      setSuccessMessage('Ürün sepetten başarıyla silindi.');
      postSystemMessage(`${currentUser.ad_soyad}, sepetten bir ürün çıkardı.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      const errMsg = error.response?.data || 'Ürün sepetten silinemedi.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteGroup = async () => {
    const isConfirmed = await confirm("Bu imece grubunu tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.");
    if (!isConfirmed) return;
    setErrorMessage('');
    try {
      await deleteGroup(group.id);
      showToast('Grup başarıyla silindi.', 'success');
      navigate('/groups');
    } catch (error) {
      const errMsg = error.response?.data || 'Grup silinemedi.';
      setErrorMessage(errMsg);
      showToast(errMsg, 'error');
    }
  };

  if (errorMessage && !group) {
    return (
      <div className="group-detail-error">
        <AlertCircle size={48} />
        <h2>Erişim Hatası</h2>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/groups')}>Gruplara Dön</button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="group-detail-loading">
        <h3>Grup Detayları Yükleniyor...</h3>
      </div>
    );
  }

  const isLeader = group.lider_id === currentUser.id;
  const hasCoordinates = Boolean(group.lokasyon_lat && group.lokasyon_lng);
  const mapsQuery = hasCoordinates
    ? `${group.lokasyon_lat},${group.lokasyon_lng}`
    : [group.lokasyon_etiketi, group.lokasyon_adresi].filter(Boolean).join(', ');
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
  const osmEmbedUrl = hasCoordinates
    ? `https://www.openstreetmap.org/export/embed.html?layer=mapnik&marker=${encodeURIComponent(`${group.lokasyon_lat},${group.lokasyon_lng}`)}`
    : null;

  return (
    <div className="group-detail-page">
      <button className="back-to-groups-btn" onClick={() => navigate('/groups')}>
        <ArrowLeft size={16} /> İmece Gruplarına Dön
      </button>

      {successMessage && (
        <div className="alert alert-success floating-alert">
          <Check size={18} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger floating-alert">
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      {/* Üst Künye */}
      <div className="group-detail-header">
        <div className="group-title-section">
          <span className={`status-badge ${group.status?.toLowerCase() || 'aktif'}`}>
            {group.status || 'AKTIF'}
          </span>
          <h1>{group.grup_adi}</h1>
          <div className="header-meta">
            <span className="meta-item"><MapPin size={14} /> {group.lokasyon_etiketi}</span>
            <span className="meta-item"><Users size={14} /> {group.members?.length} Üye</span>
            <span className="meta-item"><Star size={14} fill="#f59e0b" color="#f59e0b" /> Min. Derece Sınırı: {group.min_rating_sarti}</span>
          </div>
        </div>

        <div className="invite-section">
          <span>Davet Kodu (UUID)</span>
          <div className="invite-copy-wrapper">
            <input type="text" value={group.inviteCode || ''} readOnly />
            <button className="copy-btn" onClick={handleCopyInviteCode} title="Kodu Kopyala">
              <Clipboard size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="group-layout">
        {/* SOL SÜTUN (%70) - Sepet ve Yönetim */}
        <div className="main-content-column">
          
          {/* Lojistik Detaylar */}
          <div className="detail-card">
            <h3>Grup Lojistik Detayları & Açıklama</h3>
            <p>{group.aciklama || 'Grup lideri herhangi bir lojistik açıklama girmemiş.'}</p>
            <div className="location-info-card">
              <div className="location-info-main">
                <MapPin size={20} />
                <div>
                  <strong>{group.lokasyon_etiketi || 'Teslimat lokasyonu belirtilmedi'}</strong>
                  <span>{group.lokasyon_adresi || 'Açık adres bilgisi henüz girilmemiş.'}</span>
                </div>
              </div>
              <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer" className="location-map-link">
                <Navigation size={16} /> Google Maps'te Aç
              </a>
            </div>
            {osmEmbedUrl && (
              <div className="map-preview-frame">
                <iframe
                  title="Grup teslimat konumu"
                  src={osmEmbedUrl}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Ortak Sepet Tablosu */}
          <div className="detail-card">
            <div className="card-header-actions">
              <h3>🛒 Ortak Alışveriş Sepeti</h3>
              {group.status === 'AKTIF' ? (
                <button className="add-product-btn" onClick={() => setShowAddModal(true)}>
                  <Plus size={16} /> Sepete Ürün Ekle
                </button>
              ) : (
                <span className="lock-text"><ShieldAlert size={14} /> Ödeme Aşamasında Sepet Kilitlendi</span>
              )}
            </div>

            <div className="sepet-table-wrapper">
              <table className="sepet-table">
                <thead>
                  <tr>
                    <th>Ürün Adı</th>
                    <th>Platform</th>
                    <th>Ekleyen</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>Toplam</th>
                    <th>Link</th>
                  </tr>
                </thead>
                <tbody>
                  {group.products && group.products.length > 0 ? (
                    group.products.map((product) => {
                      const addingUser = group.members.find(m => m.id === product.ekleyenKullaniciId) || { ad_soyad: 'Bilinmeyen Kullanıcı' };
                      return (
                        <tr key={product.id}>
                          <td>
                            <div className="table-product-cell">
                              <img src={product.resimUrl || 'https://via.placeholder.com/50'} alt={product.urunAdi} />
                              <span>{product.urunAdi}</span>
                            </div>
                          </td>
                          <td><span className="platform-tag">{product.platformAdi}</span></td>
                          <td>{addingUser.ad_soyad}</td>
                          <td>{product.miktar} Adet</td>
                          <td>{product.guncelFiyat.toLocaleString('tr-TR')} ₺</td>
                          <td className="price-text">{(product.guncelFiyat * product.miktar).toLocaleString('tr-TR')} ₺</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <a href={product.urunUrl} target="_blank" rel="noopener noreferrer" className="external-link-btn">
                                Git <ExternalLink size={12} />
                              </a>
                              {group.status === 'AKTIF' && (isLeader || product.ekleyenKullaniciId === currentUser.id) && (
                                <button 
                                  onClick={() => handleRemoveProduct(product.id)} 
                                  className="remove-product-btn-small" 
                                  style={{ 
                                    background: '#ef4444', 
                                    color: 'white', 
                                    border: 'none', 
                                    padding: '4px 8px', 
                                    borderRadius: '4px', 
                                    fontSize: '11px', 
                                    cursor: 'pointer' 
                                  }}
                                  title="Ürünü sepetten çıkar"
                                >
                                  Sil
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty-table">Sepetiniz şu anda boş. Hemen bir ürün ekleyin!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="sepet-total-bar">
              <div className="total-label">TOPLAM SEPET TUTARI:</div>
              <div className="total-amount-glow">{group.totalPrice ? group.totalPrice.toLocaleString('tr-TR') : '0'} ₺</div>
            </div>
          </div>

          {/* Lider Yönetim Paneli & IBAN (Ödeme Bilgisi) */}
          <div className="detail-card">
            <h3>💳 Ödeme & Lider Yönetim Paneli</h3>
            
            {group.status === 'ODEME_BEKLENIYOR' && (
              <div className="iban-box-info">
                <h4>Lider IBAN Adresi (Ortak Ödeme Havuzu):</h4>
                {isEditingIban && isLeader ? (
                  <div className="iban-edit-wrapper">
                    <input type="text" value={iban} onChange={(e) => setIban(e.target.value)} />
                    <button className="save-iban-btn" onClick={saveIban}>Kaydet</button>
                  </div>
                ) : (
                  <div className="iban-display-wrapper">
                    <code>{iban}</code>
                    {isLeader && <button className="edit-iban-btn" onClick={() => setIsEditingIban(true)}>Düzenle</button>}
                  </div>
                )}
                <p className="iban-help-text">Ürünlerinizi sepete ekledikten sonra, kendi eklediğiniz tutarı yukarıdaki IBAN adresine havale edin. Havale sonrasında sohbet alanından lideri bilgilendirin.</p>
              </div>
            )}

            {isLeader ? (
              <div className="leader-actions-panel">
                <h4>Grup Lideri Yönetim Alanı</h4>
                <div className="status-flow-buttons">
                  <button 
                    disabled={group.status === 'AKTIF'} 
                    onClick={() => handleStatusChange('AKTIF')}
                    className="status-flow-btn active-state"
                  >
                    Aktif Sepete Dön
                  </button>
                  <button 
                    disabled={group.status === 'ODEME_BEKLENIYOR'} 
                    onClick={() => handleStatusChange('ODEME_BEKLENIYOR')}
                    className="status-flow-btn payment-state"
                  >
                    Ödeme Bekleniyor (Sepeti Kilitle)
                  </button>
                  <button 
                    disabled={group.status === 'SIPARIS_VERILDI'} 
                    onClick={() => handleStatusChange('SIPARIS_VERILDI')}
                    className="status-flow-btn ordered-state"
                  >
                    Sipariş Verildi
                  </button>
                  <button 
                    disabled={group.status === 'TAMAMLANDI'} 
                    onClick={() => handleStatusChange('TAMAMLANDI')}
                    className="status-flow-btn completed-state"
                  >
                    Sipariş Dağıtıldı / Tamamla
                  </button>
                </div>

                <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <button 
                    onClick={handleDeleteGroup}
                    className="status-flow-btn delete-group-btn"
                    style={{ 
                      background: '#ef4444', 
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} /> Grubu Tamamen Sil
                  </button>
                </div>

                {/* Üye Listesi ve Ceza Yönetimi */}
                <div className="members-management-section">
                  <h5>Grup Üyeleri Listesi ve Güvenlik</h5>
                  <div className="members-grid-detail">
                    {group.members.map((member) => (
                      <div key={member.id} className="member-detail-row">
                        <div className="member-detail-info">
                          <span>{member.ad_soyad}</span>
                          <span className="rating-span">⭐ {member.rating_puani?.toFixed(1) || '5.0'}</span>
                        </div>
                        {member.id !== group.lider_id && (
                          <button 
                            className="penalize-btn" 
                            onClick={() => handlePenalizeUser(member.id, member.ad_soyad)}
                            title="Ödemeyi yapmayıp grubu yarıda bırakan kişiyi cezalandır"
                          >
                            <ShieldAlert size={14} /> Ceza Puanı Ver (-0.5)
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="member-view-panel">
                <p>Grup durumunu ve ödeme döngüsünü yalnızca grup lideri <strong>(Lider ID: {group.lider_id})</strong> yönetebilir.</p>
                <div className="current-status-display">
                  Mevcut Durum: <span>{group.status}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SAĞ SÜTUN (%30) - Lojistik Sohbet */}
        <div className="chat-column">
          <div className="chat-panel">
            <div className="chat-header">
              <MessageSquare size={18} />
              <h3>Lojistik Sohbet Paneli</h3>
            </div>
            
            <div className="chat-messages-container">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg) => (
                  <div key={msg.id} className={`chat-message ${msg.isSystem ? 'system' : msg.senderId === currentUser.id ? 'sent' : 'received'}`}>
                    {!msg.isSystem && <div className="message-sender">{msg.sender}</div>}
                    <div className="message-text-bubble">
                      {msg.text}
                      <span className="message-time">{msg.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="chat-empty-state">
                  <MessageSquare size={32} />
                  <p>Henüz mesaj yok. Teslimat günü, kargo adresi veya ödemeler hakkında koordinasyon kurmak için yazın.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSendChatMessage}>
              <input 
                type="text" 
                placeholder="Mesajınızı yazın..." 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Ürün Ekleme Modalı */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="add-product-modal">
            <div className="modal-header-section">
              <h2>Grup Sepetine Ürün Ekle</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}><X size={20} /></button>
            </div>

            {/* Arama ve Seçme Yöntemi */}
            <div className="modal-tab-container">
              <h3>1. Yöntem: Canlı Scraper ile Ürün Bul</h3>
              <form onSubmit={handleSearchProduct} className="modal-search-form">
                <input 
                  type="text" 
                  placeholder="Örn: Dyson V15, iPhone 15..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" disabled={isSearching}>
                  {isSearching ? 'Taranıyor...' : 'Kıyasla'}
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="scraped-results-list">
                  {searchResults.map((prod, idx) => (
                    <div key={idx} className="scraped-result-item">
                      <img src={prod.resim_url} alt={prod.urun_adi} />
                      <div className="result-info">
                        <strong>{prod.urun_adi}</strong>
                        <span>{prod.platform_adi} - {prod.guncel_fiyat.toLocaleString('tr-TR')} ₺</span>
                      </div>
                      <div className="result-add-actions">
                        <input 
                          type="number" 
                          min="1" 
                          value={quantity} 
                          onChange={(e) => setQuantity(parseInt(e.target.value))} 
                        />
                        <button className="add-btn-small" onClick={() => handleAddScrapedProduct(prod)}>Ekle</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-divider">VEYA</div>

            {/* Doğrudan Link Yapıştırma Yöntemi */}
            <div className="modal-tab-container">
              <h3>2. Yöntem: Ürün Bağlantısını Doğrudan Yapıştır</h3>
              <form onSubmit={handleAddDirectProduct} className="direct-add-form">
                <div className="form-group">
                  <label>Ürün Adı</label>
                  <input 
                    type="text" 
                    placeholder="Örn: Xiaomi Air Fryer 6L" 
                    value={directTitle}
                    onChange={(e) => setDirectTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fiyat (₺)</label>
                  <input 
                    type="number" 
                    placeholder="Örn: 2499.90" 
                    value={directPrice}
                    onChange={(e) => setDirectPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Platform</label>
                  <select value={directPlatform} onChange={(e) => setDirectPlatform(e.target.value)}>
                    <option value="Trendyol">Trendyol</option>
                    <option value="Google Shopping">Google Shopping</option>
                    <option value="Hepsiburada">Hepsiburada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Ürün URL Bağlantısı</label>
                  <input 
                    type="url" 
                    placeholder="https://www.trendyol.com/..." 
                    value={directUrl}
                    onChange={(e) => setDirectUrl(e.target.value)}
                    required
                  />
                  <small style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>Lütfen sadece geçerli Trendyol, Hepsiburada veya Google Shopping bağlantıları kullanın.</small>
                </div>

                <div className="form-group">
                  <label>Miktar</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={quantity} 
                    onChange={(e) => setQuantity(parseInt(e.target.value))} 
                    required
                  />
                </div>

                <button type="submit" className="direct-submit-btn">Doğrudan Sepete Ekle</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrupDetayi;
