/**
 * @file UstBar.jsx
 * @description Uygulamanın üst gezinme barıdır (Navbar). Sayfa başlığını gösterir,
 * kullanıcı tema tercihini (Açık/Koyu) değiştirir, okunmamış bildirimleri yönetir ve kullanıcı profil/çıkış menüsünü sunar.
 */
import React, { useCallback, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Sun, Moon } from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import '../styles/AnaDuzen.css';

const UstBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : { ad_soyad: 'Ziyaretçi', email: '', rol: 'USER' };
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [notificationsRes, countRes] = await Promise.all([
        customFetch(`/api/notifications?kullaniciId=${user.id}`),
        customFetch(`/api/notifications/unread-count?kullaniciId=${user.id}`)
      ]);
      if (notificationsRes.ok) {
        setNotifications(await notificationsRes.json());
      }
      if (countRes.ok) {
        setUnreadCount(await countRes.json());
      }
    } catch (error) {
      console.error('Bildirimler alınamadı:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications, location.pathname]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleNotifications = async () => {
    const willOpen = !showNotifications;
    setShowNotifications(willOpen);
    if (willOpen) {
      await fetchNotifications();
      if (user?.id && unreadCount > 0) {
        try {
          await customFetch(`/api/notifications/read-all?kullaniciId=${user.id}`, {
            method: 'PUT'
          });
          setUnreadCount(0);
          setNotifications(prev => prev.map(notification => ({ ...notification, okundu: true })));
        } catch (error) {
          console.error('Bildirimler okundu işaretlenemedi:', error);
        }
      }
    }
  };

  const handleNotificationClick = (notification) => {
    setShowNotifications(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const pageTitles = [
    { test: /^\/$/, title: 'Genel Bakış' },
    { test: /^\/products/, title: 'Ürün Karşılaştırma' },
    { test: /^\/groups\/[^/]+/, title: 'Grup Detayı' },
    { test: /^\/groups/, title: 'İmece Grupları' },
    { test: /^\/cargo/, title: 'Kargo Takip' },
    { test: /^\/stock/, title: 'Stok Takip' },
    { test: /^\/alarms/, title: 'Fiyat Alarmları' },
    { test: /^\/contact/, title: 'İletişim ve Destek' },
    { test: /^\/settings/, title: 'Profil ve Ayarlar' },
    { test: /^\/admin/, title: 'Yönetici Paneli' },
  ];

  const currentTitle = pageTitles.find(item => item.test.test(location.pathname))?.title || 'OrtakSepet';

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>{currentTitle}</h2>
      </div>
      
      <div className="navbar-right">
        <button className="icon-btn" onClick={toggleTheme} title="Tema Değiştir">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="notification-wrap">
          <button className="icon-btn notification-btn" aria-label="Bildirimler" onClick={toggleNotifications}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
          </button>

          {showNotifications && (
            <div className="notification-menu">
              <div className="notification-menu-header">
                <strong>Bildirimler</strong>
                <span>{notifications.length} kayıt</span>
              </div>
              {notifications.length === 0 ? (
                <p className="notification-empty">Henüz bildiriminiz yok.</p>
              ) : (
                <div className="notification-list">
                  {notifications.slice(0, 6).map(notification => (
                    <button
                      key={notification.id}
                      className={`notification-item ${notification.okundu ? '' : 'unread'}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <strong>{notification.baslik}</strong>
                      <span>{notification.mesaj}</span>
                      <small>
                        {notification.olusturma_tarihi ? new Date(notification.olusturma_tarihi).toLocaleString('tr-TR') : ''}
                      </small>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="user-profile" onClick={() => navigate('/settings')}>
          <div className={`avatar ${user.rol === 'ADMIN' ? 'admin-avatar' : ''}`}>
            {getInitials(user.ad_soyad)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.ad_soyad}</span>
            <span className={`role-chip ${user.rol === 'ADMIN' ? 'admin' : ''}`}>
              {user.rol === 'ADMIN' ? 'Yönetici' : 'Üye'}
            </span>
          </div>
        </div>

        <button className="logout-btn" onClick={handleLogout} title="Çıkış Yap">
          <LogOut size={18} />
          <span>Çıkış</span>
        </button>
      </div>
    </header>
  );
};

export default UstBar;
