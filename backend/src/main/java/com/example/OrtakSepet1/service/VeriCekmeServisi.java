/**
 * VeriCekmeServisi: Playwright kullanarak Trendyol ve Hepsiburada gibi platformlardan canlı fiyat taraması (web scraping) yapar.
 * Playwright'ın engellenmesi durumunda yedek discovery API'lerini ve Google Shopping SerpApi entegrasyonunu devreye sokar.
 */
package com.example.OrtakSepet1.service;

import com.example.OrtakSepet1.entity.Urun;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.*;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Service
public class VeriCekmeServisi implements AutoCloseable {
    private static final int GOOGLE_SHOPPING_RESULT_LIMIT = 15;

    @org.springframework.beans.factory.annotation.Autowired
    private com.example.OrtakSepet1.repository.UrunRepository urunRepository;

    @Value("${playwright.headless:true}")
    private boolean headless;

    @Value("${serpapi.api.key:}")
    private String serpApiKey;

    private Playwright playwright;
    private Browser browser;

    @PostConstruct
    public void init() {
        try {
            System.out.println("[SCRAPER] Playwright paylaşımlı tarayıcı başlatılıyor (headless: " + headless + ")...");
            playwright = Playwright.create();
            browser = playwright.chromium().launch(new BrowserType.LaunchOptions()
                    .setHeadless(headless)
                    .setArgs(List.of("--no-sandbox", "--disable-setuid-sandbox")));
            System.out.println("[SCRAPER] Playwright tarayıcı başarıyla hazırlandı.");
        } catch (Exception e) {
            System.err.println("[SCRAPER] Playwright başlatma hatası: " + e.getMessage());
        }
    }

    // Playwright is not thread-safe, so we synchronize this method to prevent concurrent usage
    public synchronized List<Urun> searchProducts(String query) {
        List<Urun> results = new ArrayList<>();
        System.out.println("[SCRAPER] Canlı Playwright arama başlatıldı: " + query);

        if (browser == null) {
            System.out.println("[SCRAPER] Tarayıcı başlatılamamış, yedek API çağrılıyor...");
            return getFallbackProducts(query);
        }

        // Run sequentially to guarantee thread-safety on the Playwright instance
        Urun trendyolProd = null;
        try {
            trendyolProd = scrapeTrendyol(query);
        } catch (Exception e) {
            System.out.println("[SCRAPER] Trendyol tarama hatası: " + e.getMessage());
        }

        Urun hepsiburadaProd = null;
        try {
            hepsiburadaProd = scrapeHepsiburada(query);
        } catch (Exception e) {
            System.out.println("[SCRAPER] Hepsiburada tarama hatası: " + e.getMessage());
        }

        List<Urun> googleShoppingProducts = new ArrayList<>();
        try {
            googleShoppingProducts = searchGoogleShoppingWithSerpApi(query);
        } catch (Exception e) {
            System.out.println("[SERPAPI] Google Shopping arama hatası: " + e.getMessage());
        }

        if (trendyolProd != null) {
            results.add(trendyolProd);
        } else {
            System.out.println("[SCRAPER] Trendyol canlı veri alınamadı, yedek Trendyol verisi ekleniyor...");
            List<Urun> trendyolFallback = getTrendyolFallback(query);
            if (!trendyolFallback.isEmpty()) {
                results.add(trendyolFallback.get(0));
            }
        }

        if (hepsiburadaProd != null) {
            results.add(hepsiburadaProd);
        }

        if (!googleShoppingProducts.isEmpty()) {
            results.addAll(googleShoppingProducts);
        }

        // Save or update in database
        if (urunRepository != null) {
            for (int i = 0; i < results.size(); i++) {
                Urun p = results.get(i);
                if (p.getUrun_url() != null && !p.getUrun_url().isBlank()) {
                    try {
                        java.util.Optional<Urun> existing = urunRepository.findByUrunUrl(p.getUrun_url());
                        if (existing.isPresent()) {
                            Urun ext = existing.get();
                            ext.setGuncel_fiyat(p.getGuncel_fiyat());
                            ext.setUrun_adi(p.getUrun_adi());
                            ext.setResim_url(p.getResim_url());
                            Urun saved = urunRepository.save(ext);
                            results.set(i, saved);
                        } else {
                            Urun saved = urunRepository.save(p);
                            results.set(i, saved);
                        }
                    } catch (Exception e) {
                        System.err.println("[SCRAPER] Error saving product to DB: " + e.getMessage());
                    }
                }
            }
        }

        return results;
    }

    private Urun scrapeTrendyol(String query) {
        String url = "https://www.trendyol.com/sr?q=" + query.replace(" ", "%20");
        System.out.println("[SCRAPER] Trendyol taranıyor: " + url);
        
        try (BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                .setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .setViewportSize(1280, 720));
             Page page = context.newPage()) {
            
            page.navigate(url, new Page.NavigateOptions().setTimeout(15000));
            page.waitForLoadState();
            
            try {
                page.waitForSelector(".product-card", new Page.WaitForSelectorOptions().setTimeout(5000));
            } catch (Exception e) {
                System.out.println("[SCRAPER] Trendyol ürün kartları 5 saniye içinde yüklenmedi.");
            }

            Locator card = page.locator(".product-card").first();
            if (card.count() > 0) {
                Object result = page.evaluate("() => {" +
                    "  const cleanPriceText = (text) => {" +
                    "    if (!text) return '';" +
                    "    const parts = text.split(/\\\\s+/);" +
                    "    const priceParts = [];" +
                    "    for (let i = 0; i < parts.length; i++) {" +
                    "      const part = parts[i];" +
                    "      if (/\\\\d/.test(part) && !part.includes('%')) {" +
                    "        const hasDecimals = part.includes(',') || part.includes('.');" +
                    "        const isFollowedByCurrency = (i + 1 < parts.length && (parts[i+1].includes('TL') || parts[i+1].includes('₺')));" +
                    "        const isPrice = hasDecimals || isFollowedByCurrency || parseFloat(part.replace(/[^\\\\d]/g, '')) > 50;" +
                    "        if (isPrice) priceParts.push(part);" +
                    "      }" +
                    "    }" +
                    "    return priceParts.length > 0 ? priceParts[priceParts.length - 1] : text;" +
                    "  };" +
                    "  const card = document.querySelector('.product-card');" +
                    "  if (!card) return null;" +
                    "  const brandEl = card.querySelector('.product-brand');" +
                    "  const nameEl = card.querySelector('.product-name');" +
                    "  const priceEl = card.querySelector('.prc-box-dscntd') || " +
                    "                  card.querySelector('.prc-box-sllng') || " +
                    "                  card.querySelector('.price-value') || " +
                    "                  card.querySelector('.discounted-price') || " +
                    "                  card.querySelector('.single-price') || " +
                    "                  card.querySelector('.price-section') || " +
                    "                  card.querySelector('[class*=\"price\"]') || " +
                    "                  card.querySelector('[class*=\"prc\"]');" +
                    "  const href = card.getAttribute('href');" +
                    "  const imgEl = card.querySelector('img');" +
                    "  let imgSrc = '';" +
                    "  if (imgEl) {" +
                    "      const src = imgEl.getAttribute('src');" +
                    "      const dataSrc = imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original');" +
                    "      const srcset = imgEl.getAttribute('srcset');" +
                    "      if (src && !src.startsWith('data:image/')) imgSrc = src;" +
                    "      else if (dataSrc) imgSrc = dataSrc;" +
                    "      else if (srcset) {" +
                    "          const parts = srcset.trim().split(/\\s+/);" +
                    "          if (parts.length > 0) imgSrc = parts[0];" +
                    "      }" +
                    "  }" +
                    "  return {" +
                    "    brand: brandEl ? brandEl.innerText : ''," +
                    "    name: nameEl ? nameEl.innerText : ''," +
                    "    price: priceEl ? cleanPriceText(priceEl.innerText) : ''," +
                    "    href: href || ''," +
                    "    img: imgSrc" +
                    "  };" +
                    "}");

                if (result instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> map = (java.util.Map<String, Object>) result;
                    String brand = (String) map.getOrDefault("brand", "");
                    String name = (String) map.getOrDefault("name", "");
                    String priceText = (String) map.getOrDefault("price", "");
                    String relativeHref = (String) map.getOrDefault("href", "");
                    String imgUrl = (String) map.getOrDefault("img", "");
                    
                    if (imgUrl == null || imgUrl.isEmpty()) {
                        imgUrl = "https://via.placeholder.com/300x300/ffffff/3b82f6?text=" + query.replace(" ", "+");
                    }
                    
                    Urun p = new Urun();
                    p.setUrun_adi((brand + " " + name).trim());
                    p.setPlatform_adi("Trendyol");
                    p.setGuncel_fiyat(parsePrice(priceText));
                    p.setUrun_url(relativeHref.startsWith("http") ? relativeHref : "https://www.trendyol.com" + relativeHref);
                    p.setResim_url(imgUrl);
                    
                    System.out.println("[SCRAPER] Trendyol Ürün Bulundu: " + p.getUrun_adi() + " - " + p.getGuncel_fiyat() + " TL");
                    return p;
                }
            } else {
                System.out.println("[SCRAPER] Trendyol aramasında ürün kartı (.product-card) bulunamadı.");
            }
        } catch (Exception e) {
            System.err.println("[SCRAPER] Trendyol tarama hatası: " + e.getMessage());
        }
        return null;
    }

    private Urun scrapeHepsiburada(String query) {
        String url = "https://www.hepsiburada.com/ara?q=" + query.replace(" ", "%20");
        System.out.println("[SCRAPER] Hepsiburada taranıyor: " + url);
        
        try (BrowserContext context = browser.newContext(new Browser.NewContextOptions()
                .setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                .setViewportSize(1280, 720));
             Page page = context.newPage()) {
            
            page.navigate(url, new Page.NavigateOptions().setTimeout(15000));
            page.waitForLoadState();

            String title = page.title();
            if (title != null && title.contains("Güvenlik")) {
                System.out.println("[SCRAPER] Hepsiburada güvenlik sayfasına (bot koruması) takıldı.");
                return null;
            }

            try {
                page.waitForSelector("li[class*='productListContent'], article[class*='productCard']", new Page.WaitForSelectorOptions().setTimeout(5000));
            } catch (Exception e) {
                System.out.println("[SCRAPER] Hepsiburada ürün kartları 5 saniye içinde yüklenmedi.");
            }

            Locator card = page.locator("li[class*='productListContent'], article[class*='productCard']").first();
            if (card.count() > 0) {
                Object result = page.evaluate("() => {" +
                    "  const cleanPriceText = (text) => {" +
                    "    if (!text) return '';" +
                    "    const parts = text.split(/\\\\s+/);" +
                    "    const priceParts = [];" +
                    "    for (let i = 0; i < parts.length; i++) {" +
                    "      const part = parts[i];" +
                    "      if (/\\\\d/.test(part) && !part.includes('%')) {" +
                    "        const hasDecimals = part.includes(',') || part.includes('.');" +
                    "        const isFollowedByCurrency = (i + 1 < parts.length && (parts[i+1].includes('TL') || parts[i+1].includes('₺')));" +
                    "        const isPrice = hasDecimals || isFollowedByCurrency || parseFloat(part.replace(/[^\\\\d]/g, '')) > 50;" +
                    "        if (isPrice) priceParts.push(part);" +
                    "      }" +
                    "    }" +
                    "    return priceParts.length > 0 ? priceParts[priceParts.length - 1] : text;" +
                    "  };" +
                    "  const card = document.querySelector('li[class*=\"productListContent\"], article[class*=\"productCard\"]');" +
                    "  if (!card) return null;" +
                    "  const nameEl = card.querySelector('h2 a') || card.querySelector('[class*=\"titleText\"]') || card.querySelector('h3') || card.querySelector('a');" +
                    "  const priceEl = card.querySelector('[data-test-id*=\"final-price\"]') || " +
                    "                  card.querySelector('[class*=\"finalPrice\"]') || " +
                    "                  card.querySelector('[class*=\"price\"]') || " +
                    "                  card.querySelector('[class*=\"Price\"]');" +
                    "  const linkEl = card.querySelector('a');" +
                    "  const imgEl = card.querySelector('img');" +
                    "  let imgSrc = '';" +
                    "  if (imgEl) {" +
                    "      const src = imgEl.getAttribute('src');" +
                    "      const dataSrc = imgEl.getAttribute('data-src') || imgEl.getAttribute('data-original');" +
                    "      const srcset = imgEl.getAttribute('srcset');" +
                    "      if (src && !src.startsWith('data:image/')) imgSrc = src;" +
                    "      else if (dataSrc) imgSrc = dataSrc;" +
                    "      else if (srcset) {" +
                    "          const parts = srcset.trim().split(/\\s+/);" +
                    "          if (parts.length > 0) imgSrc = parts[0];" +
                    "      }" +
                    "  }" +
                    "  return {" +
                    "    name: nameEl ? nameEl.innerText || nameEl.getAttribute('title') : ''," +
                    "    price: priceEl ? cleanPriceText(priceEl.innerText) : ''," +
                    "    href: linkEl ? linkEl.getAttribute('href') : ''," +
                    "    img: imgSrc" +
                    "  };" +
                    "}");

                if (result instanceof java.util.Map) {
                    @SuppressWarnings("unchecked")
                    java.util.Map<String, Object> map = (java.util.Map<String, Object>) result;
                    String name = (String) map.getOrDefault("name", "");
                    String priceText = (String) map.getOrDefault("price", "");
                    String relativeHref = (String) map.getOrDefault("href", "");
                    String imgUrl = (String) map.getOrDefault("img", "");
                    
                    if (imgUrl == null || imgUrl.isEmpty()) {
                        imgUrl = "https://via.placeholder.com/300x300/ffffff/3b82f6?text=" + query.replace(" ", "+");
                    }
                    
                    Urun p = new Urun();
                    p.setUrun_adi(name.trim());
                    p.setPlatform_adi("Hepsiburada");
                    p.setGuncel_fiyat(parsePrice(priceText));
                    p.setUrun_url(relativeHref.startsWith("http") ? relativeHref : "https://www.hepsiburada.com" + relativeHref);
                    p.setResim_url(imgUrl);
                    
                    System.out.println("[SCRAPER] Hepsiburada Ürün Bulundu: " + p.getUrun_adi() + " - " + p.getGuncel_fiyat() + " TL");
                    return p;
                }
            } else {
                System.out.println("[SCRAPER] Hepsiburada aramasında ürün kartı bulunamadı.");
            }
        } catch (Exception e) {
            System.err.println("[SCRAPER] Hepsiburada tarama hatası: " + e.getMessage());
        }
        return null;
    }

    private Double parsePrice(String text) {
        if (text == null) return 0.0;
        
        String[] tokens = text.split("\\s+");
        List<Double> candidates = new ArrayList<>();
        for (String token : tokens) {
            if (token.contains("%") || !token.matches(".*\\d.*")) {
                continue;
            }
            String cleaned = token.replaceAll("[^0-9\\.,]", "").trim();
            if (cleaned.isEmpty()) continue;
            try {
                if (cleaned.contains(".") && cleaned.contains(",")) {
                    cleaned = cleaned.replace(".", "").replace(",", ".");
                } else if (cleaned.contains(",")) {
                    cleaned = cleaned.replace(",", ".");
                } else if (cleaned.contains(".")) {
                    int dotIdx = cleaned.indexOf(".");
                    if (dotIdx != -1 && cleaned.length() - dotIdx - 1 == 3) {
                        cleaned = cleaned.replace(".", "");
                    }
                }
                double val = Double.parseDouble(cleaned);
                if (val > 0) {
                    candidates.add(val);
                }
            } catch (Exception e) {
                // Ignore token errors
            }
        }
        
        if (!candidates.isEmpty()) {
            double lastCandidate = candidates.get(candidates.size() - 1);
            if (lastCandidate <= 10.0 && candidates.size() > 1) {
                for (int i = candidates.size() - 2; i >= 0; i--) {
                    if (candidates.get(i) > 10.0) {
                        return candidates.get(i);
                    }
                }
            }
            return lastCandidate;
        }
        
        String cleaned = text.replaceAll("[^0-9\\.,]", "").trim();
        if (cleaned.isEmpty()) return 0.0;
        
        try {
            if (cleaned.contains(".") && cleaned.contains(",")) {
                cleaned = cleaned.replace(".", "").replace(",", ".");
            } else if (cleaned.contains(",")) {
                cleaned = cleaned.replace(",", ".");
            } else if (cleaned.contains(".")) {
                int dotIdx = cleaned.indexOf(".");
                if (dotIdx != -1 && cleaned.length() - dotIdx - 1 == 3) {
                    cleaned = cleaned.replace(".", "");
                }
            }
            return Double.parseDouble(cleaned);
        } catch (Exception e) {
            System.err.println("[SCRAPER] Fiyat dönüştürme hatası '" + text + "': " + e.getMessage());
            return 0.0;
        }
    }

    private List<Urun> getFallbackProducts(String query) {
        List<Urun> results = new ArrayList<>();
        List<Urun> trendyolFallback = getTrendyolFallback(query);
        if (!trendyolFallback.isEmpty()) {
            results.add(trendyolFallback.get(0));
        }
        results.addAll(searchGoogleShoppingWithSerpApi(query));
        return results;
    }

    private List<Urun> searchGoogleShoppingWithSerpApi(String query) {
        List<Urun> results = new ArrayList<>();
        if (serpApiKey == null || serpApiKey.isBlank()) {
            System.out.println("[SERPAPI] SERPAPI_API_KEY tanımlı değil, Google Shopping sonuçları atlanıyor.");
            return results;
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            ObjectMapper objectMapper = new ObjectMapper();

            String url = UriComponentsBuilder.fromUriString("https://serpapi.com/search.json")
                    .queryParam("engine", "google_shopping")
                    .queryParam("q", query)
                    .queryParam("gl", "tr")
                    .queryParam("hl", "tr")
                    .queryParam("api_key", serpApiKey)
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode() != HttpStatus.OK || response.getBody() == null) {
                System.out.println("[SERPAPI] Google Shopping yanıtı başarısız: " + response.getStatusCode());
                return results;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode shoppingResults = root.path("shopping_results");
            if (!shoppingResults.isArray()) {
                System.out.println("[SERPAPI] shopping_results alanı bulunamadı.");
                return results;
            }

            int added = 0;
            for (JsonNode item : shoppingResults) {
                if (added >= GOOGLE_SHOPPING_RESULT_LIMIT) {
                    break;
                }

                String title = item.path("title").asText("");
                String source = item.path("source").asText("Google Shopping");
                String productLink = firstNonBlank(
                        item.path("product_link").asText(""),
                        item.path("link").asText(""),
                        item.path("serpapi_product_api").asText("")
                );
                String imageUrl = firstNonBlank(
                        item.path("thumbnail").asText(""),
                        item.path("serpapi_thumbnail").asText("")
                );

                double price = item.path("extracted_price").asDouble(0.0);
                if (price <= 0) {
                    price = parsePrice(item.path("price").asText(""));
                }

                if (title.isBlank() || productLink.isBlank() || price <= 0) {
                    continue;
                }

                if (imageUrl.isBlank()) {
                    imageUrl = "https://via.placeholder.com/300x300/ffffff/16a34a?text=" + query.replace(" ", "+");
                }

                Urun product = new Urun();
                product.setUrun_adi(title.trim());
                product.setPlatform_adi("Google Shopping - " + source);
                product.setGuncel_fiyat(price);
                product.setUrun_url(productLink);
                product.setResim_url(imageUrl);
                product.setBrand(source);
                results.add(product);
                added++;
            }

            System.out.println("[SERPAPI] Google Shopping sonucu eklendi: " + results.size());
        } catch (Exception e) {
            System.out.println("[SERPAPI] Google Shopping çağrısı başarısız: " + e.getMessage());
        }
        return results;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return "";
    }

    private List<Urun> getTrendyolFallback(String query) {
        List<Urun> results = new ArrayList<>();
        try {
            RestTemplate restTemplate = new RestTemplate();
            ObjectMapper objectMapper = new ObjectMapper();

            HttpHeaders headers = new HttpHeaders();
            headers.set("Kullanici-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            headers.set("Accept", "application/json");
            headers.set("Accept-Language", "tr-TR,tr;q=0.9");

            String url = "https://public.trendyol.com/discovery-web-search-service/v2/api/infinite-scroll/arama?q=" + query.replace(" ", "%20");
            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode products = root.path("result").path("products");

                if (products.isArray() && products.size() > 0) {
                    JsonNode enUcuzUrun = null;
                    double enDusukFiyat = Double.MAX_VALUE;

                    for (JsonNode product : products) {
                        double fiyat = product.path("price").path("sellingPrice").asDouble();
                        if (fiyat == 0) {
                            fiyat = product.path("sellingPrice").asDouble();
                        }
                        if (fiyat > 0 && fiyat < enDusukFiyat) {
                            enDusukFiyat = fiyat;
                            enUcuzUrun = product;
                        }
                    }

                    if (enUcuzUrun != null) {
                        String isim = enUcuzUrun.path("name").asText();
                        String marka = enUcuzUrun.path("brand").path("name").asText();
                        String urunUrl = "https://www.trendyol.com" + enUcuzUrun.path("url").asText();
                        String resimUrl = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80";
                        JsonNode imagesNode = enUcuzUrun.path("images");
                        if (imagesNode.isArray() && imagesNode.size() > 0) {
                            resimUrl = "https://cdn.dsmcdn.com" + imagesNode.get(0).asText();
                        }

                        Urun p = new Urun();
                        p.setUrun_adi(marka + " " + isim);
                        p.setPlatform_adi("Trendyol");
                        p.setGuncel_fiyat(enDusukFiyat);
                        p.setResim_url(resimUrl);
                        p.setUrun_url(urunUrl);
                        results.add(p);
                    }
                }
            }
        } catch (Exception e) {
            System.out.println("[SCRAPER] Trendyol API Fallback Hatası: " + e.getMessage());
        }
        return results;
    }



    @PreDestroy
    @Override
    public void close() {
        System.out.println("[SCRAPER] Playwright resources kapatılıyor...");
        try {
            if (browser != null) {
                browser.close();
            }
            if (playwright != null) {
                playwright.close();
            }
        } catch (Exception e) {
            System.err.println("[SCRAPER] Kapatma hatası: " + e.getMessage());
        }
    }
}
