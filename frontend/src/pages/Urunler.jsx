/**
 * @file Urunler.jsx
 * @description OrtakSepet uygulamasının ürün arama, filtreleme ve canlı fiyat karşılaştırma sayfasıdır.
 * Playwright ile Trendyol, Hepsiburada ve Google Shopping platformlarında gerçek zamanlı arama gerçekleştirir,
 * en ucuz fiyatı öne çıkarır, fiyat düşüş alarmı kurma ve imece grubu başlatma işlevlerini sunar.
 */
import React, { useState } from 'react';
import { Search, Loader, TrendingDown, DollarSign, SlidersHorizontal, ArrowUpDown, Sparkles, Tag } from 'lucide-react';
import { searchProducts } from '../services/urunServisi';
import UrunKarti from '../components/UrunKarti';
import '../styles/Urunler.css';
import emptyProducts from '../assets/illustrations/empty-products.svg';

const Urunler = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Sort and filter states
  const [sortBy, setSortBy] = useState('price-asc');
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    try {
      const data = await searchProducts(query);
      
      if (data && data.length > 0) {
        let minPrice = Math.min(...data.map(p => p.guncel_fiyat));
        const formattedData = data.map(p => ({
          ...p,
          isCheapest: p.guncel_fiyat === minPrice
        }));
        setResults(formattedData);
      } else {
        setResults([]);
      }

    } catch (error) {
      console.error("Arama başarısız:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique platforms
  const uniquePlatforms = [...new Set(results.map(p => p.platform_adi))];

  // Calculate metrics
  const prices = results.map(r => r.guncel_fiyat);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((acc, r) => acc + r, 0) / prices.length) : 0;
  const maxSavings = maxPrice - minPrice;
  const maxSavingsPercent = maxPrice > 0 ? Math.round((maxSavings / maxPrice) * 100) : 0;

  // Filter and sort results
  const togglePlatform = (platform) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform]);
    }
  };

  let displayedResults = results.filter(p => {
    if (selectedPlatforms.length === 0) return true;
    return selectedPlatforms.includes(p.platform_adi);
  });

  if (sortBy === 'price-asc') {
    displayedResults.sort((a, b) => a.guncel_fiyat - b.guncel_fiyat);
  } else if (sortBy === 'price-desc') {
    displayedResults.sort((a, b) => b.guncel_fiyat - a.guncel_fiyat);
  } else if (sortBy === 'platform') {
    displayedResults.sort((a, b) => a.platform_adi.localeCompare(b.platform_adi));
  }

  return (
    <div className="products-page">
      <div className="search-header">
        <span className="os-eyebrow"><Sparkles size={14} /> Canlı fiyat tarama</span>
        <h1>Ürün ve Fiyat Karşılaştırma</h1>
        <p>Trendyol, Hepsiburada ve Google Alışveriş sonuçlarını tek ekranda karşılaştırın; en ucuz seçeneği hızlıca bulun.</p>
        
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="Örn: Macbook Pro M3, Dyson V15..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" disabled={isLoading || !query.trim()}>
              {isLoading ? 'Taranıyor...' : 'Ara'}
            </button>
          </div>
        </form>
      </div>

      <div className="search-results">
        {isLoading ? (
          <div className="loading-state">
            <Loader className="spinner" size={48} />
            <h3>Canlı Fiyatlar Taranıyor...</h3>
            <p>Trendyol, Hepsiburada ve Google Shopping üzerinde botlarımız şu an fiyat kıyaslaması yapıyor. Bu işlem birkaç saniye sürebilir.</p>
          </div>
        ) : (
          hasSearched && (
            <>
              {results.length > 0 ? (
                <>
                  <div className="comparison-summary">
                    <div className="summary-card">
                      <DollarSign size={20} />
                      <span>En düşük</span>
                      <strong>{minPrice.toLocaleString('tr-TR')} ₺</strong>
                    </div>
                    <div className="summary-card">
                      <Tag size={20} />
                      <span>Ortalama</span>
                      <strong>{avgPrice.toLocaleString('tr-TR')} ₺</strong>
                    </div>
                    <div className="summary-card">
                      <TrendingDown size={20} />
                      <span>Maks. tasarruf</span>
                      <strong>%{maxSavingsPercent}</strong>
                    </div>
                  </div>

                  <div className="results-toolbar os-card">
                    <div className="platform-filters">
                      <SlidersHorizontal size={18} />
                      <button
                        type="button"
                        className={selectedPlatforms.length === 0 ? 'active' : ''}
                        onClick={() => setSelectedPlatforms([])}
                      >
                        Tümü
                      </button>
                      {uniquePlatforms.map(platform => (
                        <button
                          type="button"
                          key={platform}
                          className={selectedPlatforms.includes(platform) ? 'active' : ''}
                          onClick={() => togglePlatform(platform)}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                    <label className="sort-control">
                      <ArrowUpDown size={18} />
                      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                        <option value="price-asc">En ucuzdan pahalıya</option>
                        <option value="price-desc">En pahalıdan ucuza</option>
                        <option value="platform">Platforma göre</option>
                      </select>
                    </label>
                  </div>

                  <div className="results-grid">
                    {displayedResults.map((product, index) => (
                      <UrunKarti 
                        key={`${product.platform_adi}-${product.urun_url || index}`} 
                        product={product} 
                        isCheapest={product.isCheapest} 
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="os-empty-state">
                  <img src={emptyProducts} alt="" aria-hidden="true" />
                  <h3>Uygun ürün bulunamadı</h3>
                  <p>Arama kelimenizi daha kısa veya genel yazarak tekrar deneyin. Örneğin marka ve model bilgisini ayrı ayrı aramak sonuçları artırabilir.</p>
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
};

export default Urunler;
