/**
 * @file StokTakibi.jsx
 * @description Kişisel envanter ve ev ihtiyaçları yönetim sayfasıdır. Ürünleri kategorilerine ayırarak eklemeyi,
 * mevcut miktarları hızlıca (+ / -) güncellemeyi ve belirlenen kritik stok sınırının altına düşen ürünler için
 * uyarı bannerları göstermeyi sağlar.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Package, Plus, Minus, Trash2, AlertTriangle, Sparkles, Filter, 
  Search, ShoppingBag, Heart, Utensils, Boxes, TrendingDown, CheckCircle2,
  Droplets, Baby, Home, Pill, PawPrint, BookOpen, Laptop
} from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import '../styles/Urunler.css';

const StokTakibi = () => {
  const [stocks, setStocks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Hepsi');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStock, setNewStock] = useState({
    urun_adi: '',
    miktar: 5,
    kritik_esik: 2,
    kategori: 'Market',
    birim: 'adet'
  });

  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userId = user?.id;

  const categories = [
    'Hepsi',
    'Market',
    'Temizlik',
    'Kişisel Bakım',
    'Kozmetik',
    'Gıda',
    'İçecek',
    'Bebek / Çocuk',
    'Ev & Yaşam',
    'Sağlık',
    'Evcil Hayvan',
    'Kırtasiye',
    'Teknoloji',
    'Diğer'
  ];

  const stockUnits = ['adet', 'paket', 'kutu', 'kg', 'litre', 'şişe', 'rulo', 'poşet'];

  // Category styling and icon mapping
  const categoryThemes = {
    'Temizlik': {
      color: '#06b6d4',
      bgGlow: 'rgba(6, 182, 212, 0.15)',
      gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
      icon: <Sparkles size={18} color="#06b6d4" />
    },
    'Market': {
      color: '#10b981',
      bgGlow: 'rgba(16, 185, 129, 0.15)',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      icon: <ShoppingBag size={18} color="#10b981" />
    },
    'Kozmetik': {
      color: '#d946ef',
      bgGlow: 'rgba(217, 70, 239, 0.15)',
      gradient: 'linear-gradient(135deg, #d946ef, #8b5cf6)',
      icon: <Heart size={18} color="#d946ef" />
    },
    'Kişisel Bakım': {
      color: '#ec4899',
      bgGlow: 'rgba(236, 72, 153, 0.14)',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      icon: <Heart size={18} color="#ec4899" />
    },
    'Gıda': {
      color: '#f97316',
      bgGlow: 'rgba(249, 115, 22, 0.15)',
      gradient: 'linear-gradient(135deg, #f97316, #ef4444)',
      icon: <Utensils size={18} color="#f97316" />
    },
    'İçecek': {
      color: '#38bdf8',
      bgGlow: 'rgba(56, 189, 248, 0.14)',
      gradient: 'linear-gradient(135deg, #38bdf8, #2563eb)',
      icon: <Droplets size={18} color="#38bdf8" />
    },
    'Bebek / Çocuk': {
      color: '#f59e0b',
      bgGlow: 'rgba(245, 158, 11, 0.15)',
      gradient: 'linear-gradient(135deg, #f59e0b, #f97316)',
      icon: <Baby size={18} color="#f59e0b" />
    },
    'Ev & Yaşam': {
      color: '#84cc16',
      bgGlow: 'rgba(132, 204, 22, 0.14)',
      gradient: 'linear-gradient(135deg, #84cc16, #16a34a)',
      icon: <Home size={18} color="#84cc16" />
    },
    'Sağlık': {
      color: '#ef4444',
      bgGlow: 'rgba(239, 68, 68, 0.14)',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: <Pill size={18} color="#ef4444" />
    },
    'Evcil Hayvan': {
      color: '#a855f7',
      bgGlow: 'rgba(168, 85, 247, 0.14)',
      gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
      icon: <PawPrint size={18} color="#a855f7" />
    },
    'Kırtasiye': {
      color: '#0ea5e9',
      bgGlow: 'rgba(14, 165, 233, 0.14)',
      gradient: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
      icon: <BookOpen size={18} color="#0ea5e9" />
    },
    'Teknoloji': {
      color: '#64748b',
      bgGlow: 'rgba(100, 116, 139, 0.15)',
      gradient: 'linear-gradient(135deg, #64748b, #334155)',
      icon: <Laptop size={18} color="#64748b" />
    },
    'Diğer': {
      color: '#94a3b8',
      bgGlow: 'rgba(148, 163, 184, 0.15)',
      gradient: 'linear-gradient(135deg, #94a3b8, #475569)',
      icon: <Package size={18} color="#94a3b8" />
    }
  };

  const getCategoryTheme = (catName) => {
    const name = catName || 'Diğer';
    return categoryThemes[name] || categoryThemes['Diğer'];
  };

  const fetchStocks = useCallback(async () => {
    try {
      const url = userId ? `/api/stocks?kullaniciId=${userId}` : '/api/stocks';
      const res = await customFetch(url);
      if (res.ok) {
        const data = await res.json();
        setStocks(data);
      }
    } catch (err) {
      console.error("Stok verileri çekilemedi:", err);
    }
  }, [userId]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    if (!newStock.urun_adi.trim()) return;

    try {
      const res = await customFetch('/api/stocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStock,
          kullanici: user ? { id: user.id } : null
        })
      });
      if (res.ok) {
        setNewStock({ urun_adi: '', miktar: 5, kritik_esik: 2, kategori: 'Market', birim: 'adet' });
        setShowAddForm(false);
        fetchStocks();
      }
    } catch (err) {
      console.error("Stok ekleme hatası:", err);
    }
  };

  const handleUpdateQuantity = async (item, change) => {
    const newQty = Math.max(0, item.miktar + change);
    try {
      const res = await customFetch(`/api/stocks/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...item, miktar: newQty })
      });
      if (res.ok) {
        fetchStocks();
      }
    } catch (err) {
      console.error("Miktar güncelleme hatası:", err);
    }
  };

  const handleDeleteStock = async (id) => {
    try {
      const res = await customFetch(`/api/stocks/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchStocks();
      }
    } catch (err) {
      console.error("Stok silme hatası:", err);
    }
  };

  // Calculations for stats
  const totalProducts = stocks.length;
  const criticalProducts = stocks.filter(item => item.miktar <= item.kritik_esik).length;
  const safeProducts = totalProducts - criticalProducts;

  // Filtering
  const filteredStocks = stocks.filter(item => {
    const category = item.kategori || 'Diğer';
    const unit = item.birim || 'adet';
    
    // Category match
    const categoryMatches = selectedCategory === 'Hepsi' || category === selectedCategory;
    
    // Search match
    const searchMatches = item.urun_adi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          unit.toLowerCase().includes(searchQuery.toLowerCase());
                          
    return categoryMatches && searchMatches;
  });

  return (
    <div className="products-page" style={{ color: 'var(--text-primary)', minHeight: '80vh', fontFamily: "'Inter', sans-serif" }}>
      
      {/* Premium Gradient Header */}
      <div style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--card-shadow)'
      }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(114, 191, 120, 0.08) 0%, rgba(0, 0, 0, 0) 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '-50px', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(30, 108, 47, 0.06) 0%, rgba(0, 0, 0, 0) 70%)', pointerEvents: 'none' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', position: 'relative', zIndex: 2 }}>
          <div>
            <h1 style={{ fontSize: '2.4rem', fontWeight: '800', margin: 0, background: 'linear-gradient(135deg, var(--accent-color), var(--accent-hover))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Boxes size={38} color="var(--accent-color)" /> Envanter & Stok Yönetimi
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0 0', fontSize: '1rem', maxWidth: '600px', lineHeight: '1.5' }}>
              Kişisel ve ev ihtiyaçlarınızı kategorilere ayırarak akıllıca takip edin. Kritik stok limitleriyle eksilenleri anında görün.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              background: 'var(--accent-color)',
              color: '#fff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '14px',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 15px rgba(30, 108, 47, 0.15)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} /> Yeni Ürün Ekle
          </button>
        </div>
      </div>

      {/* Dashboard Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        
        {/* Stat card: Toplam Ürün */}
        <div style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={24} color="var(--accent-color)" style={{ margin: 'auto' }} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Toplam Ürün Çeşidi</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{totalProducts}</span>
          </div>
        </div>

        {/* Stat card: Kritik Stok */}
        <div style={{
          background: criticalProducts > 0 ? 'rgba(186, 26, 26, 0.05)' : 'var(--surface-color)',
          border: '1px solid ' + (criticalProducts > 0 ? 'rgba(186, 26, 26, 0.2)' : 'var(--border-color)'),
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--card-shadow)',
          animation: criticalProducts > 0 ? 'pulse 2s infinite alternate' : 'none'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: criticalProducts > 0 ? 'rgba(186, 26, 26, 0.1)' : 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={24} color={criticalProducts > 0 ? 'var(--danger-color)' : '#f59e0b'} />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Kritik Limit Altında</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: criticalProducts > 0 ? 'var(--danger-color)' : '#f59e0b' }}>{criticalProducts}</span>
          </div>
        </div>

        {/* Stat card: Güvenli Stok */}
        <div style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--border-color)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: 'var(--card-shadow)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={24} color="var(--accent-color)" />
          </div>
          <div>
            <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Yeterli Seviyede</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--accent-color)' }}>{safeProducts}</span>
          </div>
        </div>

      </div>

      {/* Manual Add Form Drawer */}
      {showAddForm && (
        <div style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--accent-color)',
          borderRadius: '24px',
          padding: '28px',
          marginBottom: '32px',
          boxShadow: 'var(--card-shadow-hover)',
          animation: 'slideDown 0.3s ease'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={20} /> Yeni Stok Kaydı Oluştur
          </h3>
          <p style={{ margin: '-10px 0 22px 0', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Mevcut stok miktarı şu anda elinizde olan sayıdır. Kritik stok eşiği ise stok bu sayıya veya altına düşünce ürünün uyarı olarak işaretleneceği seviyedir.
          </p>
          <form onSubmit={handleAddStock} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
            alignItems: 'start'
          }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Ürün Adı</label>
              <input
                type="text"
                placeholder="Örn: Fairy Bulaşık Deterjanı"
                required
                value={newStock.urun_adi}
                onChange={(e) => setNewStock({ ...newStock, urun_adi: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none', transition: 'border-color 0.2s' }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-color)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Kategori</label>
              <select
                value={newStock.kategori}
                onChange={(e) => setNewStock({ ...newStock, kategori: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                {categories.slice(1).map(cat => (
                  <option key={cat} value={cat} style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>{cat}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Mevcut Stok Miktarı</label>
              <input
                type="number"
                min="0"
                required
                value={newStock.miktar}
                onChange={(e) => setNewStock({ ...newStock, miktar: parseInt(e.target.value || '0', 10) })}
                placeholder="Örn: 3"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Şu anda elinizde bulunan adet, paket veya kutu sayısı.</small>
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Birim</label>
              <select
                value={newStock.birim}
                onChange={(e) => setNewStock({ ...newStock, birim: e.target.value })}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                {stockUnits.map(unit => (
                  <option key={unit} value={unit} style={{ background: 'var(--surface-color)', color: 'var(--text-primary)' }}>{unit}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: 'span 1' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: '600' }}>Kritik Stok Eşiği</label>
              <input
                type="number"
                min="0"
                required
                value={newStock.kritik_esik}
                onChange={(e) => setNewStock({ ...newStock, kritik_esik: parseInt(e.target.value || '0', 10) })}
                placeholder="Örn: 1"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', outline: 'none' }}
              />
              <small style={{ display: 'block', marginTop: '6px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Stok bu seviyeye veya altına inerse kritik olarak görünür.</small>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button type="button" onClick={() => setShowAddForm(false)} style={{ padding: '10px 20px', borderRadius: '12px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}>Vazgeç</button>
              <button type="submit" style={{ padding: '10px 24px', borderRadius: '12px', background: 'var(--accent-color)', border: 'none', color: '#fff', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(30, 108, 47, 0.15)', transition: 'all 0.2s' }}>Ekle</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & Search Row */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '28px', 
        flexWrap: 'wrap', 
        gap: '20px',
        background: 'var(--surface-color)',
        padding: '16px',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--card-shadow)'
      }}>
        
        {/* Category Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', maxWidth: '100%', flex: '1 1 620px', minWidth: 0, scrollbarWidth: 'thin' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const theme = getCategoryTheme(cat);
            const iconColor = isActive ? '#fff' : theme.color;
            const categoryIcon = cat === 'Hepsi' ? <Filter size={16} /> : theme.icon;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isActive ? theme.gradient : 'var(--bg-color)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid ' + (isActive ? 'transparent' : 'var(--border-color)'),
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: isActive ? `0 4px 15px ${theme.bgGlow}` : 'none',
                  flex: '0 0 auto',
                  whiteSpace: 'nowrap',
                  minHeight: '46px',
                  minWidth: 'max-content'
                }}
                onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--border-color)'; }}
                onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-color)'; }}
              >
                <span style={{ width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 18px' }}>
                  {React.cloneElement(categoryIcon, { size: 16, color: iconColor, strokeWidth: 2.4 })}
                </span>
                {cat}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Envanterde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 46px',
              borderRadius: '14px',
              background: 'var(--bg-color)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '0.9rem',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--accent-color)';
              e.target.style.boxShadow = '0 0 10px rgba(30, 108, 47, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-color)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

      </div>

      {/* Grid List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '24px' }}>
        {filteredStocks.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            background: 'var(--surface-color)',
            border: '1px dashed var(--border-color)',
            borderRadius: '24px',
            padding: '60px 40px',
            textAlign: 'center',
            color: 'var(--text-secondary)'
          }}>
            <Package size={52} style={{ marginBottom: '16px', opacity: 0.4, color: 'var(--accent-color)' }} />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Kayıtlı stok bulunamadı.</h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {searchQuery ? 'Arama kriterlerinize uyan ürün bulunmuyor.' : 'Yeni bir stok kaydı eklemek için sağ üstteki Yeni Ürün Ekle butonunu kullanın.'}
            </p>
          </div>
        ) : (
          filteredStocks.map((item) => {
            const isUnderThreshold = item.miktar <= item.kritik_esik;
            const theme = getCategoryTheme(item.kategori);
            const unit = item.birim || 'adet';
            
            // Calculate progress bar percent (capped at 100)
            const maxVal = Math.max(item.kritik_esik * 2.5, item.miktar, 1);
            const percentage = Math.min(100, Math.round((item.miktar / maxVal) * 100));
            
            return (
              <div
                key={item.id}
                style={{
                  background: 'var(--surface-color)',
                  border: '1px solid ' + (isUnderThreshold ? 'rgba(186, 26, 26, 0.25)' : 'var(--border-color)'),
                  borderRadius: '22px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: isUnderThreshold ? '0 10px 25px rgba(186, 26, 26, 0.08)' : 'var(--card-shadow)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = isUnderThreshold ? 'rgba(186, 26, 26, 0.4)' : theme.color;
                  e.currentTarget.style.boxShadow = isUnderThreshold ? '0 15px 30px rgba(186, 26, 26, 0.12)' : `0 12px 30px ${theme.bgGlow}`;
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = isUnderThreshold ? 'rgba(186, 26, 26, 0.25)' : 'var(--border-color)';
                  e.currentTarget.style.boxShadow = isUnderThreshold ? '0 10px 25px rgba(186, 26, 26, 0.08)' : 'var(--card-shadow)';
                }}
              >
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                      {item.urun_adi}
                    </h3>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: theme.bgGlow,
                      color: theme.color,
                      border: `1px solid var(--border-color)`,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      marginTop: '8px'
                    }}>
                      {theme.icon}
                      {item.kategori || 'Diğer'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteStock(item.id)}
                    style={{ 
                      background: 'var(--bg-color)', 
                      border: '1px solid var(--border-color)', 
                      color: 'var(--text-secondary)', 
                      cursor: 'pointer', 
                      padding: '8px', 
                      borderRadius: '10px', 
                      transition: 'all 0.2s' 
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = 'var(--danger-color)'; e.currentTarget.style.background = 'rgba(186, 26, 26, 0.1)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-color)'; }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Progress stock meter */}
                <div style={{ margin: '8px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>Stok Doygunluğu</span>
                    <span>{item.miktar} {unit}</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--bg-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${percentage}%`, 
                      height: '100%', 
                      background: isUnderThreshold ? 'linear-gradient(90deg, var(--danger-color), #f97316)' : 'linear-gradient(90deg, var(--accent-color), var(--accent-hover))',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Controls Area */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: 'var(--bg-color)', 
                  padding: '12px 16px', 
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Mevcut / Kritik Eşik</span>
                    <span style={{ fontWeight: '800', fontSize: '1.25rem', color: isUnderThreshold ? 'var(--danger-color)' : 'var(--accent-color)' }}>
                      {item.miktar} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{unit} / {item.kritik_esik} {unit}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleUpdateQuantity(item, -1)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--border-color)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-color)'; }}
                    >
                      <Minus size={14} />
                    </button>
                    <button
                      onClick={() => handleUpdateQuantity(item, 1)}
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '10px',
                        background: 'var(--surface-color)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'var(--border-color)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'var(--surface-color)'; }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Alarm Banner */}
                {isUnderThreshold && (
                  <div style={{
                    background: 'rgba(186, 26, 26, 0.06)',
                    color: 'var(--danger-color)',
                    border: '1px solid rgba(186, 26, 26, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'pulse 1.5s infinite alternate'
                  }}>
                    <AlertTriangle size={15} color="var(--danger-color)" />
                    <span>Kritik stok seviyesinde! Hemen tedarik edin.</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StokTakibi;
