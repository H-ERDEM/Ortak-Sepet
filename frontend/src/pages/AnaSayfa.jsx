/**
 * @file AnaSayfa.jsx
 * @description OrtakSepet uygulamasının ana kontrol panelidir (Dashboard).
 * Kullanıcının aktif gruplarını, takip ettiği fiyat alarmlarını, bekleyen kargo bilgilerini,
 * kritik stok seviyelerini özetler ve hızlı işlem linkleri sunar.
 * Admin kullanıcılar için sistem özeti ve yönetim bağlantıları gösterilir.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Users, BellRing, TrendingUp, Search, Package, Boxes, Shield, MessageSquare, Activity } from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import '../styles/AnaDuzen.css';
import dashboardSavings from '../assets/illustrations/dashboard-savings.svg';

const AnaSayfa = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { ad_soyad: 'Kullanıcı' };
  const firstName = user.ad_soyad.split(' ')[0];
  const isAdmin = user.rol === 'ADMIN';
  const userId = user?.id;

  const [dashboardData, setDashboardData] = useState({
    alarms: [],
    groups: [],
    cargos: [],
    stocks: [],
    unreadNotifications: 0
  });
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (isAdmin || !userId) return;
    setIsLoadingDashboard(true);
    try {
      const [alarmsRes, groupsRes, cargosRes, stocksRes, notificationRes] = await Promise.all([
        customFetch(`/api/alarms?kullaniciId=${userId}`),
        customFetch('/api/groups'),
        customFetch(`/api/cargos?kullaniciId=${userId}`),
        customFetch(`/api/stocks?kullaniciId=${userId}`),
        customFetch(`/api/notifications/unread-count?kullaniciId=${userId}`)
      ]);

      const [alarms, groups, cargos, stocks, unreadNotifications] = await Promise.all([
        alarmsRes.ok ? alarmsRes.json() : [],
        groupsRes.ok ? groupsRes.json() : [],
        cargosRes.ok ? cargosRes.json() : [],
        stocksRes.ok ? stocksRes.json() : [],
        notificationRes.ok ? notificationRes.json() : 0
      ]);

      setDashboardData({ alarms, groups, cargos, stocks, unreadNotifications });
    } catch (error) {
      console.error('Dashboard verileri alınamadı:', error);
    } finally {
      setIsLoadingDashboard(false);
    }
  }, [isAdmin, userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const userDashboardStats = useMemo(() => {
    const userGroups = dashboardData.groups.filter(group =>
      group.members?.some(member => member.id === userId || member.email === user.email)
    );
    const pendingCargos = dashboardData.cargos.filter(cargo => cargo.kargo_durumu !== 'Teslim Edildi');
    const criticalStocks = dashboardData.stocks.filter(stock => (stock.miktar || 0) <= (stock.kritik_esik || 0));

    // Gmail senkronizasyonundan gelen bulunan e-posta sayısını ekle (kullanıcıya özel)
    const gmailSyncCount = parseInt(localStorage.getItem(`gmailSyncCount_${userId || ''}`) || '0', 10);

    return {
      priceAlarms: dashboardData.alarms.length,
      activeGroups: userGroups.length,
      pendingCargos: pendingCargos.length + gmailSyncCount,
      unreadNotifications: Number(dashboardData.unreadNotifications || 0),
      criticalStocks: criticalStocks.length
    };
  }, [dashboardData, user.email, userId]);

  const userStats = [
    {
      title: 'Takip Edilen Fiyatlar',
      value: isLoadingDashboard ? '...' : String(userDashboardStats.priceAlarms),
      icon: <TrendingUp size={24} color="var(--accent-color)" />,
      bg: 'var(--accent-light)'
    },
    {
      title: 'Aktif İmece Grupları',
      value: isLoadingDashboard ? '...' : String(userDashboardStats.activeGroups),
      icon: <Users size={24} color="#72BF78" />,
      bg: 'rgba(114, 191, 120, 0.1)'
    },
    {
      title: 'Kargo Bekleyenler',
      value: isLoadingDashboard ? '...' : String(userDashboardStats.pendingCargos),
      icon: <ShoppingBag size={24} color="#9AD872" />,
      bg: 'rgba(154, 216, 114, 0.1)'
    },
    {
      title: 'Yeni Bildirimler',
      value: isLoadingDashboard ? '...' : String(userDashboardStats.unreadNotifications),
      icon: <BellRing size={24} color="#eab308" />,
      bg: 'rgba(234, 179, 8, 0.1)'
    }
  ];

  const adminStats = [
    {
      title: 'Kullanıcı Yönetimi',
      value: 'Admin',
      icon: <Shield size={24} color="var(--danger-color)" />,
      bg: 'rgba(239, 68, 68, 0.1)'
    },
    {
      title: 'Grup Denetimi',
      value: 'Canlı',
      icon: <Users size={24} color="var(--accent-color)" />,
      bg: 'var(--accent-light)'
    },
    {
      title: 'Destek Talepleri',
      value: 'Takip',
      icon: <MessageSquare size={24} color="var(--info-color)" />,
      bg: 'rgba(14, 165, 233, 0.1)'
    },
    {
      title: 'Sistem Aktivitesi',
      value: 'Online',
      icon: <Activity size={24} color="var(--warning-color)" />,
      bg: 'rgba(245, 158, 11, 0.1)'
    }
  ];

  const userQuickActions = [
    { title: 'Fiyat karşılaştır', desc: 'Ürün ara, en ucuz seçeneği bul.', path: '/products', icon: <Search size={20} /> },
    { title: 'İmece grubu bul', desc: 'Yakındaki ortak sepetlere katıl.', path: '/groups', icon: <Users size={20} /> },
    { title: 'Kargoları izle', desc: 'Teslimat durumlarını kontrol et.', path: '/cargo', icon: <Package size={20} /> },
    { title: 'Stokları yönet', desc: 'Eksilen ihtiyaçları takip et.', path: '/stock', icon: <Boxes size={20} /> }
  ];

  const adminQuickActions = [
    { title: 'Admin panelini aç', desc: 'Operasyon kontrol ekranına git.', path: '/admin', icon: <Shield size={20} /> },
    { title: 'Kullanıcıları yönet', desc: 'Rol ve güven puanlarını düzenle.', path: '/admin?tab=users', icon: <Users size={20} /> },
    { title: 'Destek talepleri', desc: 'Kullanıcı mesajlarını incele.', path: '/admin?tab=support', icon: <MessageSquare size={20} /> },
    { title: 'Sistem aktivitesi', desc: 'Servis ve bot durumlarını izle.', path: '/admin?tab=system', icon: <Activity size={20} /> }
  ];

  const stats = isAdmin ? adminStats : userStats;
  const quickActions = isAdmin ? adminQuickActions : userQuickActions;

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div className="welcome-text">
          <span className={`os-eyebrow ${isAdmin ? 'admin-eyebrow-inline' : ''}`}>
            {isAdmin ? 'Yönetici çalışma alanı' : 'Akıllı ortak alışveriş paneli'}
          </span>
          <h1>Tekrar hoş geldin, {firstName}</h1>
          <p>
            {isAdmin
              ? 'Kullanıcıları, destek taleplerini, imece gruplarını ve sistem aktivitesini tek yerden takip et.'
              : 'Fiyatları karşılaştır, imece gruplarını yönet ve teslimatlarını tek bir düzenli panelden takip et.'}
          </p>
        </div>
        <img className="welcome-visual" src={dashboardSavings} alt="" aria-hidden="true" />
      </div>

      <div className="dashboard-grid">
        {stats.map((stat, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-header">
              <span className="stat-title">{stat.title}</span>
              <div className="stat-icon" style={{ backgroundColor: stat.bg }}>
                {stat.icon}
              </div>
            </div>
            <div className="stat-value">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="quick-actions-grid">
        {quickActions.map((action) => (
          <Link className="quick-action-card os-card" to={action.path} key={action.path}>
            <div className="quick-action-icon">{action.icon}</div>
            <div>
              <strong>{action.title}</strong>
              <span>{action.desc}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel os-card">
          <h3>{isAdmin ? 'Admin Öncelikleri' : 'Son İmece Hareketleri'}</h3>
          <div className="panel-list">
            <div className="panel-row">
              <span>{isAdmin ? 'Kullanıcı rol denetimi' : 'Aktif grup önerileri'}</span>
              <strong>{isAdmin ? 'Açık' : `${userDashboardStats.activeGroups} grup`}</strong>
            </div>
            <div className="panel-row">
              <span>{isAdmin ? 'Destek talepleri kuyruğu' : 'Katılım bekleyen sepetler'}</span>
              <strong>{isAdmin ? 'İzle' : userDashboardStats.activeGroups > 0 ? 'Takipte' : 'Başla'}</strong>
            </div>
            <div className="panel-row">
              <span>{isAdmin ? 'Grup denetimi' : 'Lokasyon bazlı fırsatlar'}</span>
              <strong>Hazır</strong>
            </div>
          </div>
        </div>
        <div className="dashboard-panel os-card">
          <h3>{isAdmin ? 'Sistem Özeti' : 'Fiyat ve Teslimat Özeti'}</h3>
          <div className="panel-list">
            <div className="panel-row">
              <span>{isAdmin ? 'Scraper servisleri' : 'Alarm kurulabilecek ürünler'}</span>
              <strong>{isAdmin ? 'Online' : userDashboardStats.priceAlarms}</strong>
            </div>
            <div className="panel-row">
              <span>{isAdmin ? 'API erişimi' : 'Kargo takibi bekleyenler'}</span>
              <strong>{isAdmin ? 'Aktif' : userDashboardStats.pendingCargos}</strong>
            </div>
            <div className="panel-row">
              <span>{isAdmin ? 'Veri yenileme' : 'Kritik stok uyarıları'}</span>
              <strong>{isAdmin ? 'Kontrol et' : userDashboardStats.criticalStocks}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnaSayfa;
