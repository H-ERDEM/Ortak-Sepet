# 🛒 OrtakSepet — Akıllı Ortak Alışveriş ve Kargo Takip Platformu

OrtakSepet, kullanıcıların arkadaşları veya komşularıyla ortak alışveriş sepetleri oluşturarak kargo ve ürün maliyetlerini paylaşmalarını sağlayan, gelişmiş fiyat karşılaştırma/alarm robotları ve Gmail kargo entegrasyonu barındıran tam yığın (full-stack) bir web uygulamasıdır.

---

## 🚀 Öne Çıkan Özellikler

*   👥 **İmece Grupları (Ortak Sepetler):** Lokasyon bazlı gruplar kurun veya mevcut gruplara katılın. Grup üyeleriyle gerçek zamanlı mesajlaşın, ortak sepete ürün ekleyin ve liderin belirlediği IBAN üzerinden ödemeleri kolayca takip edin.
*   🔍 **Gelişmiş Fiyat Karşılaştırma & Alarm:** Vatan, Amazon vb. e-ticaret sitelerinden canlı veri çekerek (Jsoup ve Playwright kullanarak) ürün fiyatlarını karşılaştırın. Hedeflediğiniz fiyat düştüğünde bildirim alın.
*   📬 **Otomatik Gmail Kargo Takibi:** Google OAuth2 entegrasyonu sayesinde gelen kutunuz otomatik olarak taranır, kargo onay mailleri tespit edilerek kargo takip durumlarınız sisteme canlı işlenir.
*   📦 **Stok ve Kritik Eşik Yönetimi:** Elinizdeki ürünlerin stok seviyelerini takip edin. Kritik eşiğin altına düşen ürünler için otomatik uyarılar alın.
*   🛡️ **Admin Kontrol Paneli:** Kullanıcı yetkilendirmeleri, destek talepleri, sistem logları ve arka planda çalışan web kazıyıcı (scraper) servislerin durumunu anlık olarak denetleyin.

---

## 🛠️ Tech Stack

### Frontend
- React
- Axios
- CSS

### Backend
- Java 17
- Spring Boot
- Spring Security
- OAuth2

### Database
- PostgreSQL
- Hibernate
- Spring Data JPA

### Integrations
- Gmail API
- Google OAuth2
- Playwright
- Jsoup

---

## 💻 Kurulum ve Başlangıç

### Prerequisities (Gereksinimler)
*   Java 17 veya üzeri
*   Node.js ve npm
*   PostgreSQL veritabanı

### 1. Backend Kurulumu

1. `backend/src/main/resources` klasörüne gidin.
2. `application-local.properties.example` dosyasının bir kopyasını oluşturup adını `application-local.properties` yapın:
   ```bash
   cp backend/src/main/resources/application-local.properties.example backend/src/main/resources/application-local.properties
   ```
3. `application-local.properties` dosyasının içini kendi veritabanı şifreniz ve Google OAuth (Gmail) API kimlik bilgilerinizle doldurun:
   ```properties
   spring.datasource.password=LOKAL_POSTGRES_SIFRENIZ
   spring.security.oauth2.client.registration.google.client-id=GOOGLE_CLIENT_ID
   spring.security.oauth2.client.registration.google.client-secret=GOOGLE_CLIENT_SECRET
   ```
4. Backend projesini ayağa kaldırın:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

### 2. Frontend Kurulumu

1. Frontend klasörüne gidin:
   ```bash
   cd frontend
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı başlatın:
   ```bash
   npm start
   ```
   *Uygulama varsayılan olarak tarayıcınızda `http://localhost:3000` adresinde açılacaktır.*

---

## 📸 Uygulama Ekran Görüntüleri

| Giriş / Kayıt Ekranı | Ana Sayfa / Dashboard | Aktif İmece Grupları Listesi |
| :---: | :---: | :---: |
| ![Giriş / Kayıt Ekranı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.26.png) | ![Ana Sayfa / Dashboard](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.33.png) | ![Aktif İmece Grupları Listesi](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.24.56.png) |

| İmece Grup Detayı | Grup İçi Sohbet ve Ortak Sepet | Fiyat Karşılaştırma & Arama |
| :---: | :---: | :---: |
| ![İmece Grup Detayı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.02.png) | ![Grup İçi Sohbet ve Ortak Sepet](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.13.png) | ![Fiyat Karşılaştırma & Arama](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.28.png) |

| Fiyat Alarmları Listesi | Kargo Takip Ekranı | Stok Takip Sayfası |
| :---: | :---: | :---: |
| ![Fiyat Alarmları Listesi](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.34.png) | ![Kargo Takip Ekranı](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.43.png) | ![Stok Takip Sayfası](ortak%20sepet%20resimleri/Screenshot%202026-06-11%20at%2018.25.50.png) |

---

## 📝 Lisans

Bu proje eğitim ve kişisel gelişim amacıyla geliştirilmiştir. Ticari amaçla kullanımı önerilmez.
