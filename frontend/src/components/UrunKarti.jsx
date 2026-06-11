/**
 * @file UrunKarti.jsx
 * @description Fiyat karşılaştırma arama sonuçlarında ürünleri listelemek için kullanılan şık, animasyonlu kart bileşenidir.
 * Ürün bilgilerini gösterir, harici siteye yönlendirir, fiyat alarmı kurar ve bu ürün için İmece Grubu başlatma düğmesi sunar.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Tag, Bell, Users } from 'lucide-react';
import { customFetch } from '../services/apiIstemcisi';
import { useToast } from '../context/BildirimBaglami';
import '../styles/UrunKarti.css';

const UrunKarti = ({ product, isCheapest }) => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState(product.guncel_fiyat ? Math.round(product.guncel_fiyat * 0.9) : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleSetAlarm = async (e) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) {
      showToast("Lütfen geçerli bir hedef fiyat girin.", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await customFetch('/api/alarms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urun_adi: product.urun_adi,
          guncel_fiyat: product.guncel_fiyat,
          hedef_fiyat: targetPrice ? parseFloat(String(targetPrice).replace(',', '.')) : 0.0,
          platform_adi: product.platform_adi,
          urun_url: product.urun_url,
          resim_url: product.resim_url,
          bildirim_turu: 'E-posta',
          kullanici: user ? { id: user.id } : null
        })
      });
      if (res.ok) {
        showToast("Fiyat alarmı başarıyla kuruldu! Hedef fiyata ulaştığında bilgilendirileceksiniz.", "success");
        setShowModal(false);
      } else {
        showToast("Fiyat alarmı kurulurken hata oluştu.", "error");
      }
    } catch (err) {
      console.error("Alarm kurulurken hata:", err);
      showToast("Ağ hatası oluştu.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`product-card ${isCheapest ? 'cheapest' : ''}`}>
      {isCheapest && (
        <div className="cheapest-badge">
          <Tag size={14} />
          En Ucuz
        </div>
      )}
      
      <div className="product-image">
        <img src={product.resim_url || 'https://via.placeholder.com/150'} alt={product.urun_adi} referrerPolicy="no-referrer" />
      </div>
      
      <div className="product-details">
        <div className="product-platform">{product.platform_adi}</div>
        <h3 className="product-title">{product.urun_adi}</h3>
        
        <div className="product-actions-stack">
          <div className="product-price-row">
            <div className="product-price">
              {product.guncel_fiyat.toLocaleString('tr-TR')} ₺
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="alarm-chip-btn"
              title="Fiyat Alarmı Kur"
            >
              <Bell size={14} /> Alarm Kur
            </button>
          </div>
          
          <div className="product-card-actions">
            <a href={product.urun_url} target="_blank" rel="noopener noreferrer" className="buy-btn">
              Git <ExternalLink size={14} />
            </a>
            <button 
              onClick={() => navigate('/groups', { state: { prefill: product } })}
              className="imece-btn"
            >
              <Users size={14} /> İmece Başlat
            </button>
          </div>
        </div>
      </div>

      {/* Alarm Modal Dialog */}
      {showModal && (
        <div className="modal-backdrop product-modal-backdrop">
          <div className="alarm-modal">
            <div className="alarm-modal-header">
              <Bell size={20} color="#f59e0b" />
              <h3>Fiyat Alarmı Kur</h3>
            </div>

            <p className="alarm-modal-desc">
              <strong>{product.urun_adi}</strong> ürünü belirlediğiniz hedef fiyatın altına düştüğünde sizi anlık olarak uyaracağız.
            </p>

            <form onSubmit={handleSetAlarm} className="alarm-modal-form">
              <div>
                <label>Mevcut Fiyat</label>
                <div className="alarm-current-price">{product.guncel_fiyat?.toLocaleString('tr-TR')} ₺</div>
              </div>

              <div>
                <label>Hedef Fiyat (₺)</label>
                <input 
                  type="number" 
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="os-input"
                  placeholder="Örn: 1500"
                />
              </div>

              <div className="alarm-modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="os-button os-button-ghost"
                >
                  Vazgeç
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="os-button os-button-primary"
                >
                  {isSubmitting ? 'Kuruluyor...' : 'Alarmı Kur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UrunKarti;
