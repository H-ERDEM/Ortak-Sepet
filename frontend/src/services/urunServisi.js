/**
 * @file urunServisi.js
 * @description Ürün arama ve canlı karşılaştırma (scraping) isteklerini backend üzerindeki REST API'ye ileten servis fonksiyonlarını içerir.
 */
import apiClient from './apiIstemcisi';

const API_URL = '/api/products';

// Arama kelimesine göre ürünleri getirir
export const searchProducts = async (query) => {
  try {
    const response = await apiClient.get(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error("Ürün arama hatası:", error);
    throw error;
  }
};
