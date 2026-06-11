/**
 * @file AnaDuzen.jsx
 * @description Uygulamanın genel sayfa düzeni (Layout) şablonudur.
 * Sol menüyü (YanMenu), üst barı (UstBar) ve alt bilgiyi (Footer) içerir.
 * Sayfa yüklendiğinde kullanıcının oturum kontrolünü gerçekleştirir; oturum yoksa giriş sayfasına yönlendirir.
 */
import React, { useEffect } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import YanMenu from '../components/YanMenu';
import UstBar from '../components/UstBar';
import '../styles/AnaDuzen.css';

const AnaDuzen = () => {
  const navigate = useNavigate();
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    // Sayfa yüklendiğinde oturum kontrolü yap
    const user = localStorage.getItem('user');
    if (!user) {
      // Eğer kullanıcı yoksa login'e yönlendir
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="layout-wrapper">
      <YanMenu />
      <div className="main-content">
        <UstBar />
        <main className="page-container">
          {/* İç sayfalar (AnaSayfa vb.) burada render edilecek */}
          <Outlet />
        </main>
        <footer className="app-footer">
          <div>
            <strong>OrtakSepet</strong>
            <span>© 2026</span>
          </div>
          <p>Topluluk alışverişi, fiyat takibi ve stok yönetimi tek panelde.</p>
          <nav aria-label="Alt menü">
            <Link to="/contact">Destek</Link>
            <Link to="/settings">Ayarlar</Link>
            {user?.rol === 'ADMIN' && <Link to="/admin">Yönetici Paneli</Link>}
          </nav>
        </footer>
      </div>
    </div>
  );
};

export default AnaDuzen;
