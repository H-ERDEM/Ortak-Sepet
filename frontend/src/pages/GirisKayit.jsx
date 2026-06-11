/**
 * @file GirisKayit.jsx
 * @description Kullanıcıların sisteme kaydolduğu veya mevcut hesaplarıyla giriş yaptığı giriş ve kayıt olma sayfasıdır.
 * Giriş işlemi sonrasında kullanıcı verilerini localStorage'a kaydeder ve ana sayfaya yönlendirir.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiIstemcisi';
import '../styles/GirisKayit.css';
import authCommunityShopping from '../assets/illustrations/auth-community-shopping.svg';

const GirisKayit = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    ad_soyad: '',
    email: '',
    telefon: '',
    sifre: '',
    rol: 'Üye',
    rating_puani: 5.0,
    tema_tercihi: 'dark'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      if (isLogin) {
        // Login Request
        const { data } = await apiClient.post('/api/users/giris', {
          email: formData.email,
          sifre: formData.sifre
        });
        setMessage({ type: 'success', text: `Hoşgeldiniz, ${data.ad_soyad || data.email}!` });
        // Kullanıcıyı localStorage'a kaydet
        localStorage.setItem('user', JSON.stringify(data));
        // Ana sayfaya yönlendir (0.5 saniye sonra kullanıcı mesajı görebilsin diye)
        setTimeout(() => {
          navigate('/');
        }, 500);
      } else {
        // Register Request
        await apiClient.post('/api/users/kayit', formData);
        setMessage({ type: 'success', text: `Kayıt başarılı! Lütfen giriş yapın.` });
        setTimeout(() => {
          setIsLogin(true);
          setMessage({ type: '', text: '' });
        }, 2000);
      }
    } catch (error) {
      if (error.response && error.response.data) {
        setMessage({ type: 'error', text: typeof error.response.data === 'string' ? error.response.data : 'Bir hata oluştu.' });
      } else {
        setMessage({ type: 'error', text: 'Sunucuya bağlanılamadı. Backend çalışıyor mu?' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-visual-panel">
        <span className="os-eyebrow">Ortak alışveriş deneyimi</span>
        <h2>Fiyatları karşılaştır, güvenilir gruplarla ortak sepet oluştur.</h2>
        <p>OrtakSepet; alışveriş, teslimat ve stok takibini tek panelde sade bir akışa dönüştürür.</p>
        <img src={authCommunityShopping} alt="" aria-hidden="true" />
      </div>

      <div className="auth-card">
        
        <div className="auth-header">
          <h1>OrtakSepet</h1>
          <p>{isLogin ? 'Hesabınıza giriş yapın' : 'Aramıza katılın'}</p>
        </div>

        <div className="auth-toggle">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(true); setMessage({ type: '', text: '' }); }}
          >
            Giriş Yap
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(false); setMessage({ type: '', text: '' }); }}
          >
            Kayıt Ol
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <>
              <div className="form-group">
                <input 
                  type="text" 
                  name="ad_soyad" 
                  id="ad_soyad"
                  placeholder="Ad Soyad"
                  value={formData.ad_soyad}
                  onChange={handleChange}
                  required 
                />
                <label htmlFor="ad_soyad">Ad Soyad</label>
              </div>
              <div className="form-group">
                <input 
                  type="tel" 
                  name="telefon" 
                  id="telefon"
                  placeholder="Telefon"
                  value={formData.telefon}
                  onChange={handleChange}
                />
                <label htmlFor="telefon">Telefon</label>
              </div>
            </>
          )}

          <div className="form-group">
            <input 
              type="email" 
              name="email" 
              id="email"
              placeholder="E-posta"
              value={formData.email}
              onChange={handleChange}
              required 
            />
            <label htmlFor="email">E-posta</label>
          </div>

          <div className="form-group">
            <input 
              type="password" 
              name="sifre" 
              id="sifre"
              placeholder="Şifre"
              value={formData.sifre}
              onChange={handleChange}
              required 
            />
            <label htmlFor="sifre">Şifre</label>
          </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}
          </button>
        </form>

      </div>
    </div>
  );
};

export default GirisKayit;
