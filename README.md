# 🛒 OrtakSepet

> **Akıllı Ortak Alışveriş, Canlı Fiyat Takibi ve Otomatik Kargo/Stok Yönetim Platformu**

[![Java](https://img.shields.io/badge/Java_17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)

OrtakSepet, bireysel alışverişlerdeki yüksek kargo ücretlerini ve koordinasyon zorluklarını ortadan kaldırmak amacıyla geliştirilmiş **birlikte alışveriş (imece)** platformudur. Kullanıcılar lokasyon bazlı alışveriş grupları kurabilir, gerçek zamanlı fiyat takip robotları ile bütçelerini optimize edebilir ve Google OAuth2/Gmail entegrasyonu sayesinde sipariş ve kargo süreçlerini tek bir merkezden izleyebilirler.

---

## ✨ Önemli Özellikler

### 👥 İmece Grupları (Sosyal Sepetler)
*   **Lokasyon Bazlı Arama:** Çevrenizdeki açık sepet gruplarını arayın ve tek tuşla katılın.
*   **Gerçek Zamanlı Sohbet:** Entegre grup içi mesajlaşma ile sepet detaylarını konuşun.
*   **Birlikte Sepet Yönetimi:** Sepete ortaklaşa ürün ekleyin ve liderin IBAN ödeme durumunu takip edin.
*   **Güven Puanı (Rating):** Kullanıcıların sepet güvenilirliğini değerlendirin.

### 🔍 Akıllı Fiyat Karşılaştırma & Alarm Robotu
*   **Çoklu Platform Taraması:** Amazon, Vatan vb. e-ticaret platformlarından Playwright ve Jsoup ile anlık fiyat verisi çeker.
*   **Fiyat Alarmları:** Hedeflediğiniz fiyat seviyesine ulaşıldığında anında sistem bildirimi alırsınız.
*   **Fiyat Geçmişi:** Ürünlerin fiyat değişim trendlerini görün.

### 📬 Otomatik Gmail & Kargo Takibi
*   **Gmail Tarayıcı:** Google OAuth2 ile Gmail gelen kutunuz taranarak kargo firmalarından gelen onay kodları ve durumları otomatik olarak sisteme aktarılır.
*   **Canlı Durum Güncellemesi:** Kargo hareketlerini manuel takip etmenize gerek kalmaz.

### 📦 Entegre Stok Takip Sistemi
*   **Kritik Eşik Uyarıları:** Evinizde veya ofisinizde sık tüketilen ürünler için stok seviyesi tanımlayın.
*   **Otomatik Eksik Listesi:** Kritik eşiğin altına düşen ürünleri doğrudan yeni bir alışveriş grubuna ekleyin.

---

## 🛠️ Tech Stack

| Katman | Teknolojiler |
| :--- | :--- |
| **Frontend** | React (CRA), Axios, Vanilla CSS, Lucide React (İkonlar) |
| **Backend** | Java 17, Spring Boot 4.0.x, Spring Security, OAuth2 Client, WebFlux / WebClient |
| **Veritabanı** | PostgreSQL, Hibernate ORM, Spring Data JPA |
| **Entegrasyonlar** | Google API Client, Gmail API (v1), Microsoft Playwright (Headless Web Scraping), Jsoup |

---

## 📂 Dosya Yapısı

```
Ortak-Sepet-Proje/
├── backend/                  # Spring Boot Maven Projesi
│   ├── src/main/java/        # Backend kaynak kodları (Controller, Service, Entity, DTO, vb.)
│   └── src/main/resources/   # Uygulama ayarları (application.properties)
├── frontend/                 # React SPA Projesi
│   ├── src/components/       # Yeniden kullanılabilir React bileşenleri
│   ├── src/pages/            # Sayfa bileşenleri (Dashboard, Alarmlar, Gruplar, vb.)
│   └── src/styles/           # Özel CSS dosyaları
└── ortak sepet resimleri/    # Proje ekran görüntüleri
```

---

## ⚙️ Kurulum ve Yapılandırma

### Gereksinimler
- **Java JDK 17+**
- **Node.js v18+**
- **PostgreSQL 14+**
- **Google Cloud Console Projesi** (Gmail API ve OAuth2 erişimi için)

### 1. Backend Kurulumu

> [!IMPORTANT]
> Güvenlik nedeniyle hassas API anahtarlarınızı `application.properties` dosyasına eklemeyiniz. Bunun yerine `application-local.properties` profilini kullanınız.

1. `backend/src/main/resources` dizinine gidin.
2. Örnek dosyadan lokal ayarlar dosyanızı oluşturun:
   ```bash
   cp backend/src/main/resources/application-local.properties.example backend/src/main/resources/application-local.properties
   ```
3. `application-local.properties` dosyasını kendi kimlik bilgilerinizle doldurun:
   ```properties
   spring.datasource.password=POSTGRES_VERITABANI_SIFRENIZ
   spring.security.oauth2.client.registration.google.client-id=GOOGLE_CLIENT_ID
   spring.security.oauth2.client.registration.google.client-secret=GOOGLE_CLIENT_SECRET
   ```
4. Backend uygulamasını derleyin ve çalıştırın:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

### 2. Frontend Kurulumu

1. `frontend` dizinine geçiş yapın ve bağımlılıkları kurun:
   ```bash
   cd frontend
   npm install
   ```
2. Uygulamayı yerel sunucuda başlatın:
   ```bash
   npm start
   ```
   *Uygulama `http://localhost:3000` adresinde çalışmaya başlayacaktır.*

---

## 📸 Uygulama Ekran Görüntüleri

| Giriş / Kayıt Ekranı | Ana Sayfa / Dashboard | Aktif İmece Grupları Listesi |
| :---: | :---: | :---: |
| ![Giriş / Kayıt Ekranı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.26.png) | ![Ana Sayfa / Dashboard](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.33.png) | ![Aktif İmece Grupları Listesi](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.56.png) |

| İmece Grup Detayı | Grup İçi Sohbet ve Ortak Sepet | Fiyat Karşılaştırma & Arama |
| :---: | :---: | :---: |
| ![İmece Grup Detayı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.02.png) | ![Grup İçi Sohbet ve Ortak Sepet](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.13.png) | ![Fiyat Karşılaştırma & Arama]([ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.28.png](ortak sepet resimleri/Screenshot 2026-05-23 at 10.47.11.png) |

| Fiyat Alarmları Listesi | Kargo Takip Ekranı | Stok Takip Sayfası |
| :---: | :---: | :---: |
| ![Fiyat Alarmları Listesi](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.34.png) | ![Kargo Takip Ekranı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.43.png) | ![Stok Takip Sayfası](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.50.png) |

---

## 🤝 Katkıda Bulunma

1. Bu projeyi fork edin (`https://github.com/H-ERDEM/Ortak-Sepet/fork`).
2. Kendi özelliğinizi içeren yeni bir dal (branch) açın: `git checkout -b feature/yeniozellik`.
3. Değişikliklerinizi commitleyin: `git commit -m 'Yenilik: Yeni özellik eklendi'`.
4. Dalı push edin: `git push origin feature/yeniozellik`.
5. Bir Pull Request oluşturun.

---

## 📝 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için lisans dosyasına göz atabilirsiniz.
