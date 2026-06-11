/**
 * @file App.js
 * @description Uygulamanın ana bileşenidir. React Router kullanarak sayfalar arası rotaları (routes) tanımlar,
 * bildirim ve onay kutusu (toast & confirm context) sağlayıcılarını sarmalayarak tüm uygulamaya dağıtır.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GirisKayit from './pages/GirisKayit';
import AnaDuzen from './layouts/AnaDuzen';
import AnaSayfa from './pages/AnaSayfa';
import Urunler from './pages/Urunler';
import Gruplar from './pages/Gruplar';
import GrupDetayi from './pages/GrupDetayi';
import KargoStok from './pages/KargoStok';
import StokTakibi from './pages/StokTakibi';
import Alarmlar from './pages/Alarmlar';
import Iletisim from './pages/Iletisim';
import Ayarlar from './pages/Ayarlar';
import YoneticiPaneli from './pages/YoneticiPaneli';
import { ToastProvider } from './context/BildirimBaglami';
import { ConfirmProvider } from './components/OnayModali';
import './styles/global.css';

function App() {
  return (
    <ToastProvider>
      <ConfirmProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Public Route */}
              <Route path="/login" element={<GirisKayit />} />

              {/* Protected Routes inside AnaDuzen */}
              <Route path="/" element={<AnaDuzen />}>
                <Route index element={<AnaSayfa />} />
                <Route path="products" element={<Urunler />} />
                <Route path="groups" element={<Gruplar />} />
                <Route path="groups/:id" element={<GrupDetayi />} />
                <Route path="cargo" element={<KargoStok />} />
                <Route path="stock" element={<StokTakibi />} />
                <Route path="alarms" element={<Alarmlar />} />
                <Route path="contact" element={<Iletisim />} />
                <Route path="settings" element={<Ayarlar />} />
                <Route path="admin" element={<YoneticiPaneli />} />
              </Route>

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </ConfirmProvider>
    </ToastProvider>
  );
}

export default App;