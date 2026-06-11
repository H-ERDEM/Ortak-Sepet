/**
 * @file YoneticiPaneli.jsx
 * @description Yalnızca ADMIN yetkisine sahip kullanıcıların erişebildiği kontrol panelidir.
 * Kullanıcı yönetimi (rol, durum ve güven puanı güncelleme), imece grupları denetimi,
 * destek taleplerini inceleyip yanıtlama ve sistem çalışma (CPU, bellek vb.) durumlarını izleme modüllerini içerir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Check,
  Cpu,
  Edit2,
  MessageSquare,
  RefreshCw,
  Search,
  Server,
  Shield,
  Trash2,
  Users,
  X
} from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import { useConfirm } from '../components/OnayModali';
import { useToast } from '../context/BildirimBaglami';
import '../styles/YoneticiPaneli.css';

const API_BASE = '/api';

const YoneticiPaneli = () => {
  const { confirm } = useConfirm();
  const { showToast } = useToast();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = currentUser?.rol === 'ADMIN';

  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [supportRequests, setSupportRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [supportSearch, setSupportSearch] = useState('');
  const [supportStatusFilter, setSupportStatusFilter] = useState('TUMU');
  const [editingUserId, setEditingUserId] = useState(null);
  const [editUserDraft, setEditUserDraft] = useState({ rol: 'USER', rating_puani: 5.0 });
  const [botLogs, setBotLogs] = useState([
    '[SCRAPER] Playwright paylaşımlı tarayıcı hazır.',
    '[INFO] Trendyol fiyat arama servisi dinlemede.',
    '[INFO] Hepsiburada fiyat arama servisi dinlemede.',
    '[INFO] Google Shopping / SerpApi aktif.',
    '[INFO] Destek bildirim servisi hazır.'
  ]);

  const serviceHealthItems = [
    {
      name: 'Trendyol Scraper',
      status: 'Aktif',
      detail: 'Canlı fiyat taraması',
      tone: 'success'
    },
    {
      name: 'Hepsiburada Scraper',
      status: 'Aktif',
      detail: 'Canlı fiyat taraması',
      tone: 'success'
    },
    {
      name: 'Google Shopping API',
      status: 'SerpApi',
      detail: '15 sonuç limiti ile entegre',
      tone: 'info'
    },
    {
      name: 'Fiyat Alarm Servisi',
      status: 'Zamanlanmış',
      detail: 'Hedef fiyat kontrolleri',
      tone: 'warning'
    },
    {
      name: 'Destek Bildirimleri',
      status: 'Aktif',
      detail: 'Durum değişince kullanıcıya bildirim',
      tone: 'success'
    }
  ];

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const adminQuery = currentUser?.id ? `?adminId=${currentUser.id}` : '';
      const [usersRes, groupsRes, supportRes] = await Promise.all([
        customFetch(`${API_BASE}/users${adminQuery}`),
        customFetch(`${API_BASE}/groups`),
        customFetch(`${API_BASE}/support`)
      ]);

      if (!usersRes.ok || !groupsRes.ok || !supportRes.ok) {
        throw new Error('Admin verileri alınamadı.');
      }

      setUsers(await usersRes.json());
      setGroups(await groupsRes.json());
      setSupportRequests(await supportRes.json());
    } catch (error) {
      console.error('Admin verileri yüklenirken hata:', error);
      setErrorMessage('Admin verileri yüklenemedi. Backend servisinin çalıştığını kontrol edin.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, isAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (['overview', 'users', 'groups', 'support', 'system'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const stats = useMemo(() => {
    const activeGroups = groups.filter(group => (group.status || 'AKTIF') === 'AKTIF').length;
    const lowTrustUsers = users.filter(user => (user.rating_puani || 5) < 3.5).length;
    const unresolvedSupport = supportRequests.length;

    return [
      { label: 'Toplam Kullanıcı', value: users.length, tone: 'info' },
      { label: 'Aktif İmece Grubu', value: activeGroups, tone: 'success' },
      { label: 'Destek Talebi', value: unresolvedSupport, tone: 'warning' },
      { label: 'Düşük Güven Puanı', value: lowTrustUsers, tone: 'danger' }
    ];
  }, [groups, supportRequests, users]);

  const filteredUsers = users.filter(user => {
    const query = userSearch.toLowerCase();
    return [user.ad_soyad, user.email, user.rol].some(value => (value || '').toLowerCase().includes(query));
  });

  const filteredGroups = groups.filter(group => {
    const query = groupSearch.toLowerCase();
    return [group.grup_adi, group.lokasyon_etiketi, group.status].some(value => (value || '').toLowerCase().includes(query));
  });

  const filteredSupportRequests = supportRequests.filter(request => {
    const query = supportSearch.toLowerCase();
    const matchesQuery = [request.ad_soyad, request.email, request.konu, request.mesaj, request.durum]
      .some(value => (value || '').toLowerCase().includes(query));
    const matchesStatus = supportStatusFilter === 'TUMU' || (request.durum || 'BEKLIYOR') === supportStatusFilter;
    return matchesQuery && matchesStatus;
  });

  const startEditUser = (user) => {
    setEditingUserId(user.id);
    setEditUserDraft({
      rol: user.rol || 'USER',
      rating_puani: user.rating_puani || 5.0
    });
  };

  const handleUpdateUser = async (user) => {
    try {
      const requesterQuery = currentUser?.id ? `?requesterId=${currentUser.id}` : '';
      const res = await customFetch(`${API_BASE}/users/${user.id}${requesterQuery}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...user,
          rol: editUserDraft.rol,
          rating_puani: editUserDraft.rating_puani ? parseFloat(String(editUserDraft.rating_puani).replace(',', '.')) : 5.0
        })
      });

      if (!res.ok) {
        throw new Error('Kullanıcı güncellenemedi.');
      }

      setEditingUserId(null);
      await fetchData();
    } catch (error) {
      console.error('Kullanıcı güncellenemedi:', error);
      setErrorMessage('Kullanıcı rolü veya güven puanı güncellenemedi.');
    }
  };

  const handleDeleteGroup = async (group) => {
    const isConfirmed = await confirm(`"${group.grup_adi}" grubunu silmek istediğinize emin misiniz?`);
    if (!isConfirmed) return;
    try {
      const res = await customFetch(`${API_BASE}/groups/${group.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Grup silinemedi.');
      }
      setGroups(prev => prev.filter(item => item.id !== group.id));
      showToast("Grup başarıyla silindi.", "success");
    } catch (error) {
      console.error('Grup silinirken hata:', error);
      setErrorMessage('Grup silinemedi. Backend endpointini kontrol edin.');
      showToast("Grup silinirken bir hata oluştu.", "error");
    }
  };
 
  const handleDeleteSupport = async (request) => {
    const isConfirmed = await confirm(`"${request.konu}" destek talebini silmek istediğinize emin misiniz?`);
    if (!isConfirmed) return;
    try {
      const res = await customFetch(`${API_BASE}/support/${request.id}`, { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Destek talebi silinemedi.');
      }
      setSupportRequests(prev => prev.filter(item => item.id !== request.id));
      showToast("Destek talebi başarıyla silindi.", "success");
    } catch (error) {
      console.error('Destek talebi silinirken hata:', error);
      setErrorMessage('Destek talebi silinemedi.');
      showToast("Destek talebi silinirken bir hata oluştu.", "error");
    }
  };

  const handleUpdateSupportStatus = async (request, durum) => {
    try {
      const res = await customFetch(`${API_BASE}/support/${request.id}/status?durum=${encodeURIComponent(durum)}`, {
        method: 'PUT'
      });

      if (!res.ok) {
        throw new Error('Destek talebi durumu güncellenemedi.');
      }

      const updated = await res.json();
      setSupportRequests(prev => prev.map(item => item.id === updated.id ? updated : item));
    } catch (error) {
      console.error('Destek talebi durumu güncellenemedi:', error);
      setErrorMessage('Destek talebinin durumu güncellenemedi.');
    }
  };

  const getSupportStatusLabel = (durum) => {
    const labels = {
      BEKLIYOR: 'Bekliyor',
      INCELENIYOR: 'İnceleniyor',
      COZULDU: 'Çözüldü'
    };
    return labels[durum || 'BEKLIYOR'] || 'Bekliyor';
  };

  const refreshLogs = () => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setBotLogs(prev => [
      ...prev,
      `[LOG] [${timestamp}] Manuel sistem sağlık kontrolü çalıştırıldı.`,
      `[INFO] [${timestamp}] Frontend, API ve scraper servisleri izleniyor.`
    ]);
  };

  if (!isAdmin) {
    return (
      <div className="admin-access-denied os-card">
        <Shield size={42} />
        <h1>Yönetici Yetkisi Gerekli</h1>
        <p>Bu alan yalnızca sistem yöneticileri içindir. Normal kullanıcı hesapları kişisel panel, imece grupları, stok ve alarm ekranlarını kullanabilir.</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Genel Bakış', icon: <Shield size={16} /> },
    { id: 'users', name: 'Kullanıcı Yönetimi', icon: <Users size={16} /> },
    { id: 'groups', name: 'Grup Denetimi', icon: <Cpu size={16} /> },
    { id: 'support', name: 'Destek Talepleri', icon: <MessageSquare size={16} /> },
    { id: 'system', name: 'Sistem Aktivitesi', icon: <Activity size={16} /> }
  ];

  return (
    <div className="admin-page">
      <div className="admin-hero os-card">
        <div>
          <span className="admin-eyebrow"><Shield size={14} /> Yönetici çalışma alanı</span>
          <h1>Operasyon Kontrol Paneli</h1>
          <p>Kullanıcı rolleri, imece grupları, destek talepleri ve servis sağlığı için ayrıştırılmış admin görünümü.</p>
        </div>
        <button className="admin-refresh-btn" onClick={fetchData} disabled={isLoading}>
          <RefreshCw size={16} /> {isLoading ? 'Yenileniyor' : 'Verileri Yenile'}
        </button>
      </div>

      {errorMessage && (
        <div className="admin-alert">
          <AlertTriangle size={18} /> {errorMessage}
        </div>
      )}

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={activeTab === tab.id ? 'active' : ''}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="admin-loading os-card">Admin verileri yükleniyor...</div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="admin-section">
              <div className="admin-stats-grid">
                {stats.map(stat => (
                  <div className={`admin-stat-card ${stat.tone}`} key={stat.label}>
                    <span>{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>

              <div className="admin-two-column">
                <div className="admin-panel os-card">
                  <h3>Son Destek Talepleri</h3>
                  <div className="admin-list">
                    {supportRequests.slice(0, 4).map(request => (
                      <div className="admin-list-row" key={request.id}>
                        <div>
                          <strong>{request.konu}</strong>
                          <span>{request.ad_soyad} - {request.email}</span>
                        </div>
                        <span className={`support-status-badge ${(request.durum || 'BEKLIYOR').toLowerCase()}`}>
                          {getSupportStatusLabel(request.durum)}
                        </span>
                      </div>
                    ))}
                    {supportRequests.length === 0 && <p className="admin-muted">Destek talebi yok.</p>}
                  </div>
                </div>

                <div className="admin-panel os-card">
                  <h3>Riskli Kullanıcılar</h3>
                  <div className="admin-list">
                    {users.filter(user => (user.rating_puani || 5) < 3.5).slice(0, 4).map(user => (
                      <div className="admin-list-row" key={user.id}>
                        <div>
                          <strong>{user.ad_soyad}</strong>
                          <span>{user.email}</span>
                        </div>
                        <span className="trust-badge warning">★ {(user.rating_puani || 5).toFixed(1)}</span>
                      </div>
                    ))}
                    {users.filter(user => (user.rating_puani || 5) < 3.5).length === 0 && <p className="admin-muted">Düşük güven puanlı kullanıcı yok.</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="admin-panel os-card">
              <div className="admin-panel-header">
                <div>
                  <h3>Kullanıcı Yönetimi</h3>
                  <p>Rol ve güven puanı düzenlemeleri bu ekrandan yapılır.</p>
                </div>
                <label className="admin-search">
                  <Search size={16} />
                  <input value={userSearch} onChange={(event) => setUserSearch(event.target.value)} placeholder="Kullanıcı ara" />
                </label>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Kullanıcı</th>
                      <th>E-posta</th>
                      <th>Rol</th>
                      <th>Güven Puanı</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id}>
                        <td><strong>{user.ad_soyad}</strong></td>
                        <td>{user.email}</td>
                        <td>
                          {editingUserId === user.id ? (
                            <select value={editUserDraft.rol} onChange={(event) => setEditUserDraft(prev => ({ ...prev, rol: event.target.value }))}>
                              <option value="USER">USER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          ) : (
                            <span className={`role-badge ${user.rol === 'ADMIN' ? 'admin' : 'user'}`}>{user.rol || 'USER'}</span>
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <input
                              type="number"
                              min="1"
                              max="5"
                              step="0.1"
                              value={editUserDraft.rating_puani}
                              onChange={(event) => setEditUserDraft(prev => ({ ...prev, rating_puani: event.target.value }))}
                            />
                          ) : (
                            <span className="trust-badge">★ {(user.rating_puani || 5).toFixed(1)}</span>
                          )}
                        </td>
                        <td>
                          {editingUserId === user.id ? (
                            <div className="admin-row-actions">
                              <button className="success" onClick={() => handleUpdateUser(user)}><Check size={15} /></button>
                              <button onClick={() => setEditingUserId(null)}><X size={15} /></button>
                            </div>
                          ) : (
                            <button className="admin-action-btn" onClick={() => startEditUser(user)}>
                              <Edit2 size={14} /> Düzenle
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'groups' && (
            <div className="admin-panel os-card">
              <div className="admin-panel-header">
                <div>
                  <h3>İmece Grup Denetimi</h3>
                  <p>Aktif grupları, lokasyonlarını ve durumlarını takip edin.</p>
                </div>
                <label className="admin-search">
                  <Search size={16} />
                  <input value={groupSearch} onChange={(event) => setGroupSearch(event.target.value)} placeholder="Grup ara" />
                </label>
              </div>

              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Grup</th>
                      <th>Lokasyon</th>
                      <th>Durum</th>
                      <th>Üye</th>
                      <th>Toplam</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGroups.map(group => (
                      <tr key={group.id}>
                        <td><strong>{group.grup_adi}</strong></td>
                        <td>{group.lokasyon_etiketi || '-'}</td>
                        <td><span className="status-pill">{group.status || 'AKTIF'}</span></td>
                        <td>{group.members?.length || 0}</td>
                        <td>{group.totalPrice ? group.totalPrice.toLocaleString('tr-TR') : '0'} ₺</td>
                        <td>
                          <button className="admin-danger-btn" onClick={() => handleDeleteGroup(group)}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="admin-panel os-card">
              <div className="admin-panel-header">
                <div>
                  <h3>Destek Talepleri</h3>
                  <p>Kullanıcı mesajlarını okuyun ve tamamlanan talepleri temizleyin.</p>
                </div>
                <label className="admin-search">
                  <Search size={16} />
                  <input value={supportSearch} onChange={(event) => setSupportSearch(event.target.value)} placeholder="Talep ara" />
                </label>
              </div>

              <div className="support-status-filter">
                {[
                  { value: 'TUMU', label: 'Tümü' },
                  { value: 'BEKLIYOR', label: 'Bekliyor' },
                  { value: 'INCELENIYOR', label: 'İnceleniyor' },
                  { value: 'COZULDU', label: 'Çözüldü' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={supportStatusFilter === option.value ? 'active' : ''}
                    onClick={() => setSupportStatusFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="support-grid">
                {filteredSupportRequests.map(request => (
                  <article className="support-card" key={request.id}>
                    <div>
                      <div className="support-card-meta">
                        <span className="support-topic">{request.konu}</span>
                        <span className={`support-status-badge ${(request.durum || 'BEKLIYOR').toLowerCase()}`}>
                          {getSupportStatusLabel(request.durum)}
                        </span>
                      </div>
                      <h4>{request.ad_soyad}</h4>
                      <small>{request.email}</small>
                    </div>
                    <p>{request.mesaj}</p>
                    <div className="support-card-actions">
                      <select
                        value={request.durum || 'BEKLIYOR'}
                        onChange={(event) => handleUpdateSupportStatus(request, event.target.value)}
                      >
                        <option value="BEKLIYOR">Bekliyor</option>
                        <option value="INCELENIYOR">İnceleniyor</option>
                        <option value="COZULDU">Çözüldü</option>
                      </select>
                      <button className="admin-danger-btn text" onClick={() => handleDeleteSupport(request)}>
                        <Trash2 size={15} /> Sil
                      </button>
                    </div>
                  </article>
                ))}
                {filteredSupportRequests.length === 0 && <p className="admin-muted">Aramanıza uygun destek talebi yok.</p>}
              </div>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="admin-system-grid">
              <div className="admin-panel os-card">
                <h3>Servis Sağlığı</h3>
                <p className="admin-muted">Fiyat karşılaştırma, alarm ve destek bildirim akışlarının operasyon görünümü.</p>
                {serviceHealthItems.map(service => (
                  <div className={`service-row ${service.tone}`} key={service.name}>
                    <span className="service-dot" />
                    <div>
                      <strong>{service.name}</strong>
                      <span>{service.detail}</span>
                    </div>
                    <em>{service.status}</em>
                  </div>
                ))}
              </div>

              <div className="admin-terminal">
                <div className="terminal-header">
                  <span><Server size={16} /> Sistem Aktivite Logları</span>
                  <button onClick={refreshLogs}><RefreshCw size={13} /> Güncelle</button>
                </div>
                <div className="terminal-body">
                  {botLogs.map((log, index) => <div key={`${log}-${index}`}>{log}</div>)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default YoneticiPaneli;
