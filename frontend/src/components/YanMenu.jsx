/**
 * @file YanMenu.jsx
 * @description Sol tarafta yer alan gezinme (navigation) menüsüdür.
 * Kullanıcının rolüne (ADMIN / standart) göre farklı linkler sunarak,
 * Dashboard, Ürün Karşılaştırma, İmece Grupları, Kargo/Stok Takip gibi sayfalara yönlendirme sağlar.
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Users, Package, Settings as Ayarlar, Search, Boxes, BellRing, Mail, Shield, Activity, MessageSquare } from 'lucide-react';
import '../styles/AnaDuzen.css';

const YanMenu = () => {
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const isAdmin = user && user.rol === 'ADMIN';

  const navItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard className="nav-icon" /> },
    { path: '/products', name: 'Ürün Karşılaştırma', icon: <Search className="nav-icon" /> },
    { path: '/groups', name: 'İmece Grupları', icon: <Users className="nav-icon" /> },
    { path: '/cargo', name: 'Kargo Takip', icon: <Package className="nav-icon" /> },
    { path: '/stock', name: 'Stok Takip', icon: <Boxes className="nav-icon" /> },
    { path: '/alarms', name: 'Fiyat Alarmları', icon: <BellRing className="nav-icon" /> },
    { path: '/contact', name: 'İletişim & Destek', icon: <Mail className="nav-icon" /> },
    { path: '/settings', name: 'Ayarlar', icon: <Ayarlar className="nav-icon" /> },
  ];

  const adminItems = [
    { path: '/admin', name: 'Yönetici Paneli', icon: <Shield className="nav-icon" /> },
    { path: '/admin?tab=users', name: 'Kullanıcı Yönetimi', icon: <Users className="nav-icon" /> },
    { path: '/admin?tab=support', name: 'Destek Talepleri', icon: <MessageSquare className="nav-icon" /> },
    { path: '/admin?tab=system', name: 'Sistem Aktivitesi', icon: <Activity className="nav-icon" /> },
    { path: '/settings', name: 'Ayarlar', icon: <Ayarlar className="nav-icon" /> },
  ];

  const visibleItems = isAdmin ? adminItems : navItems;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <ShoppingCart size={28} />
          OrtakSepet
        </NavLink>
      </div>
      
      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isAdmin ? 'admin-nav-item' : ''} ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default YanMenu;
