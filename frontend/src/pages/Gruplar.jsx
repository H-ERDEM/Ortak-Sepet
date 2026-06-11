/**
 * @file Gruplar.jsx
 * @description OrtakSepet uygulamasının aktif İmece Gruplarının listelendiği, davet kodu ile gruplara katılım sağlandığı,
 * harita konum seçimi ve minimum güven puanı kriterleri belirlenerek yeni alışveriş gruplarının kurulduğu sayfadır.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, MapPin, Star, AlertCircle, CheckCircle, Navigation, ExternalLink } from 'lucide-react';
import { getAllGroups, createGroup, joinGroup, searchGroups, addProductToGroup, getGroup } from '../services/grupServisi';
import { useToast } from '../context/BildirimBaglami';
import '../styles/Gruplar.css';
import emptyGroups from '../assets/illustrations/empty-groups.svg';

const Gruplar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { id: 1, ad_soyad: 'Kullanıcı', rating_puani: 5.0 };

  const [groups, setGroups] = useState([]);
  const { showToast } = useToast();
  const [lokasyon, setLokasyon] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showAllGroups, setShowAllGroups] = useState(false);

  // Create form state
  const [grupAdi, setGrupAdi] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [lokasyonEtiketi, setLokasyonEtiketi] = useState('');
  const [lokasyonAdresi, setLokasyonAdresi] = useState('');
  const [lokasyonLat, setLokasyonLat] = useState('');
  const [lokasyonLng, setLokasyonLng] = useState('');
  const [minRatingSarti, setMinRatingSarti] = useState(4.0);
  const [prefillProduct, setPrefillProduct] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (location.state && location.state.prefill) {
      const { urun_adi, guncel_fiyat, platform_adi } = location.state.prefill;
      setPrefillProduct(location.state.prefill);
      // Limit product name length for group title
      const cleanTitle = urun_adi.length > 25 ? urun_adi.substring(0, 25) + '...' : urun_adi;
      setGrupAdi(`${cleanTitle} İmece Grubu`);
      setAciklama(`${platform_adi} üzerinden ${guncel_fiyat.toLocaleString('tr-TR')} ₺ fiyatındaki bu ürünü ortak alarak kargo ücretinden tasarruf etmek istiyoruz.`);
      setShowCreateModal(true);
    }
  }, [location]);

  const fetchGroups = async () => {
    try {
      const data = await getAllGroups();
      // Show only groups where current user is a member by default
      if (showAllGroups) {
        setGroups(data);
      } else {
        const filtered = data.filter(g => Boolean(g.members?.some(member => member.id === user.id || member.email === user.email)));
        setGroups(filtered);
      }
    } catch (error) {
      console.error('Gruplar alınamadı:', error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      if (lokasyon.trim() === '') {
        fetchGroups();
      } else {
        const data = await searchGroups(lokasyon);
        setGroups(data);
      }
    } catch (error) {
      console.error('Arama hatası:', error);
    }
  };

  const handleJoinWithCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const joinedGroup = await joinGroup(inviteCode.trim(), user.id);
      setSuccessMessage(`Gruba başarıyla katıldınız: ${joinedGroup.grup_adi}`);
      setInviteCode('');
      fetchGroups();
      setTimeout(() => {
        navigate(`/groups/${joinedGroup.id}`);
      }, 1500);
    } catch (error) {
      setErrorMessage(error.response?.data || 'Gruba katılım sağlanamadı. Güven puanınızı veya grubun durumunu kontrol edin.');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!grupAdi.trim() || !lokasyonEtiketi.trim()) return;
    setErrorMessage('');
    try {
      const groupData = {
        grup_adi: grupAdi,
        aciklama: aciklama,
        lokasyon_etiketi: lokasyonEtiketi,
        lokasyon_adresi: lokasyonAdresi,
        lokasyon_lat: lokasyonLat ? parseFloat(String(lokasyonLat).replace(',', '.')) : null,
        lokasyon_lng: lokasyonLng ? parseFloat(String(lokasyonLng).replace(',', '.')) : null,
        min_rating_sarti: minRatingSarti ? parseFloat(String(minRatingSarti).replace(',', '.')) : 4.0
      };

      if (prefillProduct) {
        groupData.prefillProduct = {
          urunAdi: prefillProduct.urun_adi,
          guncelFiyat: prefillProduct.guncel_fiyat,
          urunUrl: prefillProduct.urun_url || "https://google.com/search?q=" + encodeURIComponent(prefillProduct.urun_adi),
          resimUrl: prefillProduct.resim_url,
          platformAdi: prefillProduct.platform_adi,
          miktar: 1
        };
      }

      const newGroup = await createGroup(groupData, user.id);

      setShowCreateModal(false);
      setGrupAdi('');
      setAciklama('');
      setLokasyonEtiketi('');
      setLokasyonAdresi('');
      setLokasyonLat('');
      setLokasyonLng('');
      setMinRatingSarti(4.0);
      setPrefillProduct(null);
      fetchGroups();

      if (prefillProduct && newGroup.products && newGroup.products.length > 0) {
        showToast('Ön tanımlı ürün başarıyla sepete eklendi.', 'success');
        navigate(`/groups/${newGroup.id}`, { state: { group: newGroup } });
      } else {
        if (prefillProduct) {
          showToast('Grup oluşturuldu ancak ön tanımlı ürün eklenirken sorun oluştu.', 'warning');
        }
        navigate(`/groups/${newGroup.id}`);
      }
    } catch (error) {
      setErrorMessage('Grup oluşturulamadı. Lütfen alanları kontrol edin.');
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Tarayıcınız konum özelliğini desteklemiyor.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLokasyonLat(position.coords.latitude.toFixed(6));
        setLokasyonLng(position.coords.longitude.toFixed(6));
        setSuccessMessage('Konum koordinatlarınız forma eklendi.');
        setTimeout(() => setSuccessMessage(''), 2000);
      },
      () => {
        setErrorMessage('Konum alınamadı. Tarayıcı izinlerini kontrol edin veya koordinatı elle girin.');
      }
    );
  };

  const getMapsQuery = (group) => {
    if (group.lokasyon_lat && group.lokasyon_lng) {
      return `${group.lokasyon_lat},${group.lokasyon_lng}`;
    }
    return [group.lokasyon_etiketi, group.lokasyon_adresi].filter(Boolean).join(', ');
  };

  const getGoogleMapsUrl = (group) => (
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getMapsQuery(group))}`
  );

  const isCurrentUserMember = (group) => (
    Boolean(group.members?.some(member => member.id === user.id || member.email === user.email))
  );

  return (
    <div className="groups-page">
      <div className="groups-header">
        <div>
          <span className="os-eyebrow"><Users size={14} /> Topluluk alışverişi</span>
          <h1>İmece Alışveriş Grupları</h1>
          <p>Aynı bölgedeki kişilerle ortak sipariş verin, kargo ücretinden tasarruf edin.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="create-group-btn" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Yeni İmece Grubu Başlat
          </button>
          <button 
            className={`toggle-groups-btn ${showAllGroups ? 'all' : 'mine'}`} 
            onClick={() => { setShowAllGroups(!showAllGroups); fetchGroups(); }}
            title="Tüm grupları göster / sadece benim gruplarım"
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e6eef7', background: showAllGroups ? '#eef2ff' : '#ffffff' }}
          >
            {showAllGroups ? 'Tüm Gruplar' : 'Sadece Benim Gruplarım'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="alert alert-success">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger">
          <AlertCircle size={18} /> {errorMessage}
        </div>
      )}

      <div className="filter-and-invite-bar">
        {/* Lokasyon Filtreleme */}
        <form className="filter-form" onSubmit={handleSearch}>
          <MapPin className="filter-icon" size={18} />
          <input 
            type="text" 
            placeholder="Lokasyona göre ara (örn: İnönü Üniversitesi)..." 
            value={lokasyon}
            onChange={(e) => setLokasyon(e.target.value)}
          />
          <button type="submit">Filtrele</button>
        </form>

        {/* Davet Kodu ile Katılma */}
        <form className="join-code-form" onSubmit={handleJoinWithCode}>
          <input 
            type="text" 
            placeholder="Davet Kodu Girin (UUID)..." 
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
          <button type="submit">Koda Göre Katıl</button>
        </form>
      </div>

      {/* Gruplar Listesi */}
      <div className="groups-grid">
        {groups.length > 0 ? (
          groups.map((group) => {
            const isMember = isCurrentUserMember(group);
            return (
            <div key={group.id} className={`group-card ${isMember ? 'member-group-card' : ''}`} onClick={() => navigate(`/groups/${group.id}`)}>
              <div className="group-card-header">
                <span className={`status-badge ${group.status?.toLowerCase() || 'aktif'}`}>
                  {group.status || 'AKTIF'}
                </span>
                {isMember ? (
                  <span className="member-badge">
                    <CheckCircle size={14} /> Üyesiniz
                  </span>
                ) : (
                  <span className="rating-badge">
                    <Star size={14} fill="#f59e0b" color="#f59e0b" /> {group.min_rating_sarti}+ Puan
                  </span>
                )}
              </div>

              <h3>{group.grup_adi}</h3>
              <p className="group-desc">{group.aciklama || 'Açıklama belirtilmemiş.'}</p>

              <div className="group-meta">
                <div className="meta-item">
                  <MapPin size={14} />
                  <span>{group.lokasyon_etiketi}</span>
                </div>
                <div className="meta-item">
                  <Users size={14} />
                  <span>👥 {group.members?.length || 1} Katılımcı</span>
                </div>
              </div>

              <div className="group-card-footer">
                <div className="total-price">
                  <span>Toplam Sepet</span>
                  <strong>{group.totalPrice ? group.totalPrice.toLocaleString('tr-TR') : '0'} ₺</strong>
                </div>
                <div className="group-card-actions">
                  <a
                    className="map-link-btn"
                    href={getGoogleMapsUrl(group)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Google Maps'te aç"
                  >
                    <ExternalLink size={13} /> Harita
                  </a>
                  <button className="join-btn">{isMember ? 'Gruba Git' : 'İncele'}</button>
                </div>
              </div>
            </div>
            );
          })
        ) : (
          <div className="empty-groups os-empty-state">
            <img src={emptyGroups} alt="" aria-hidden="true" />
            <h3>Henüz Aktif İmece Grubu Yok</h3>
            <p>İlk grubu siz başlatarak çevrenizdeki kişilerle tasarruflu alışveriş yapın.</p>
          </div>
        )}
      </div>

      {/* Grup Oluşturma Modalı */}
      {showCreateModal && (
        <div className="modal-backdrop">
          <div className="create-group-modal">
            <h2>Yeni İmece Grubu Oluştur</h2>
            <p>Bölgenizdeki insanlarla beraber sepet oluşturup sipariş verin.</p>

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label>Grup Adı</label>
                <input 
                  type="text" 
                  placeholder="Örn: Mühendislik Fakültesi Dyson Ortak Sepeti" 
                  value={grupAdi} 
                  onChange={(e) => setGrupAdi(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Açıklama / Lojistik Detaylar</label>
                <textarea 
                  placeholder="Kargolar nereye gelecek, nasıl dağıtılacak vb." 
                  value={aciklama} 
                  onChange={(e) => setAciklama(e.target.value)}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Teslimat Lokasyon Etiketi</label>
                <input 
                  type="text" 
                  placeholder="Örn: İnönü Üniversitesi Kampüsü, Mühendislik Binası" 
                  value={lokasyonEtiketi} 
                  onChange={(e) => setLokasyonEtiketi(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Açık Adres / Buluşma Noktası</label>
                <textarea
                  placeholder="Örn: Mühendislik Fakültesi ana giriş, danışma önü"
                  value={lokasyonAdresi}
                  onChange={(e) => setLokasyonAdresi(e.target.value)}
                  rows="2"
                />
              </div>

              <div className="location-coordinate-grid">
                <div className="form-group">
                  <label>Enlem</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="38.3552"
                    value={lokasyonLat}
                    onChange={(e) => setLokasyonLat(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Boylam</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="38.3095"
                    value={lokasyonLng}
                    onChange={(e) => setLokasyonLng(e.target.value)}
                  />
                </div>
              </div>

              <button type="button" className="use-location-btn" onClick={handleUseCurrentLocation}>
                <Navigation size={16} /> Konumumu Kullan
              </button>

              <div className="form-group">
                <label>Gerekli Minimum Güven Puanı (⭐ 1.0 - 5.0)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="1.0" 
                  max="5.0" 
                  value={minRatingSarti} 
                  onChange={(e) => setMinRatingSarti(e.target.value)}
                  required 
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Vazgeç
                </button>
                <button type="submit" className="submit-btn">
                  Grup Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gruplar;
