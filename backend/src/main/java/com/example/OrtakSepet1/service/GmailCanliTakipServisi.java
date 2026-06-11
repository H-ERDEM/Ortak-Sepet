/**
 * GmailCanliTakipServisi: Kullanıcının Google OAuth2 ile yetkilendirilmiş
 *  Gmail gelen kutusunu tarar.
 * Sipariş onay ve teslimat e-postalarındaki kargo takip kodlarını 
 * regex ile ayıklayarak durumlarını takip eder.
 */
package com.example.OrtakSepet1.service;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.gmail.Gmail;
import com.google.api.services.gmail.model.ListMessagesResponse;
import com.google.api.services.gmail.model.Message;
import com.google.auth.http.HttpCredentialsAdapter;
import com.google.auth.oauth2.AccessToken;
import com.google.auth.oauth2.GoogleCredentials;
import com.example.OrtakSepet1.entity.Kargo;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.KargoRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import org.springframework.stereotype.Service;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizeRequest;
import java.util.Date;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class GmailCanliTakipServisi {

    private final KargoRepository cargoRepository;
    private final KullaniciRepository userRepository;
    private final OAuth2AuthorizedClientManager authorizedClientManager;

    private String accessToken;
    private String clientRegistrationId;
    private String principalName;

    public GmailCanliTakipServisi(KargoRepository cargoRepository,
                                    KullaniciRepository userRepository,
                                    @org.springframework.context.annotation.Lazy OAuth2AuthorizedClientManager authorizedClientManager) {
        this.cargoRepository = cargoRepository;
        this.userRepository = userRepository;
        this.authorizedClientManager = authorizedClientManager;
    }

    public synchronized void setAccessToken(String token) {
        this.accessToken = token;
    }

    public synchronized void setOAuth2Details(String clientRegistrationId, String principalName, String token) {
        this.clientRegistrationId = clientRegistrationId;
        this.principalName = principalName;
        this.accessToken = token;
    }

    public void saveUserOAuth2Details(Long userId, String clientRegistrationId, String principalName, String token) {
        userRepository.findById(userId).ifPresent(user -> {
            String tokenField = clientRegistrationId + "::" + principalName + "::" + token;
            user.setGmail_token(tokenField);
            userRepository.save(user);
        });
        setOAuth2Details(clientRegistrationId, principalName, token);
    }

    public synchronized String getAccessToken() {
        return this.accessToken;
    }

    public boolean isConnected() {
        return this.accessToken != null || (this.clientRegistrationId != null && this.principalName != null);
    }

    public boolean isUserConnected(Long userId) {
        if (userId == null) {
            return isConnected();
        }
        return userRepository.findById(userId).map(user -> {
            String tokenField = user.getGmail_token();
            if (tokenField == null || tokenField.isEmpty()) {
                return false;
            }
            String[] parts = tokenField.split("::");
            return parts.length >= 3;
        }).orElse(false);
    }

    public List<String> syncGmailInbox(Long kullaniciId) {
        List<String> logs = new ArrayList<>();
        
        String currentToken = this.accessToken;
        String currentClientRegistrationId = this.clientRegistrationId;
        String currentPrincipalName = this.principalName;
        Date expirationDate = null;

        if (kullaniciId != null) {
            Kullanici user = userRepository.findById(kullaniciId).orElse(null);
            if (user != null && user.getGmail_token() != null && !user.getGmail_token().isEmpty()) {
                String[] parts = user.getGmail_token().split("::");
                if (parts.length >= 3) {
                    currentClientRegistrationId = parts[0];
                    currentPrincipalName = parts[1];
                    currentToken = parts[2];
                }
            }
        }

        if (currentClientRegistrationId != null && currentPrincipalName != null) {
            try {
                OAuth2AuthorizeRequest authorizeRequest = OAuth2AuthorizeRequest
                        .withClientRegistrationId(currentClientRegistrationId)
                        .principal(currentPrincipalName)
                        .build();
                OAuth2AuthorizedClient authorizedClient = authorizedClientManager.authorize(authorizeRequest);
                if (authorizedClient != null && authorizedClient.getAccessToken() != null) {
                    currentToken = authorizedClient.getAccessToken().getTokenValue();
                    if (authorizedClient.getAccessToken().getExpiresAt() != null) {
                        expirationDate = Date.from(authorizedClient.getAccessToken().getExpiresAt());
                    }
                    if (kullaniciId != null) {
                        saveUserOAuth2Details(kullaniciId, currentClientRegistrationId, currentPrincipalName, currentToken);
                    } else {
                        setOAuth2Details(currentClientRegistrationId, currentPrincipalName, currentToken);
                    }
                }
            } catch (Exception e) {
                logs.add("Token yenileme hatası (Spring Security): " + e.getMessage());
                e.printStackTrace();
                // Clear the invalid/expired token from the database
                if (kullaniciId != null) {
                    userRepository.findById(kullaniciId).ifPresent(u -> {
                        u.setGmail_token(null);
                        userRepository.save(u);
                    });
                }
                // Reset in-memory details
                setOAuth2Details(null, null, null);
                currentToken = null;
            }
        }

        if (currentToken == null) {
            logs.add("Hata: Google OAuth2 bağlantısı bulunamadı. Lütfen Gmail hesabınızı bağlayın.");
            return logs;
        }

        ListMessagesResponse response = null;
        try {
            GoogleCredentials credentials = GoogleCredentials.create(new AccessToken(currentToken, expirationDate));
            Gmail service = new Gmail.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("OrtakSepet")
                    .build();

            response = service.users().messages().list("me")
                    .setQ("subject:(kargo OR kargonuz OR sipariş OR siparişiniz OR siparişi OR siparis OR gönderi OR gönderiniz OR gonderi OR teslimat OR teslim OR paket OR paketiniz OR paketi OR iade OR iaden OR \"yola çıktı\" OR \"kargoya verildi\") -subject:(kampanya OR indirim OR fırsat OR firsat OR menü OR menu OR bülten OR bulten OR bedava OR hediye OR uçuş OR ucus OR pegasus OR cafe OR bilet OR davet OR \"giriş denemesi\" OR \"güvenlik kodu\" OR \"şifre sıfırlama\")")
                    .setMaxResults(50L)
                    .execute();
        } catch (Exception apiErr) {
            logs.add("Gmail API hatası: " + apiErr.getMessage());
            return logs;
        }

        try {
            GoogleCredentials credentials = GoogleCredentials.create(new AccessToken(currentToken, expirationDate));
            Gmail service = new Gmail.Builder(
                    GoogleNetHttpTransport.newTrustedTransport(),
                    GsonFactory.getDefaultInstance(),
                    new HttpCredentialsAdapter(credentials))
                    .setApplicationName("OrtakSepet")
                    .build();

            List<Message> messages = response != null ? response.getMessages() : null;
            if (messages == null || messages.isEmpty()) {
                logs.add("Arama kriterlerine uygun e-posta bulunamadı (subject: kargo/sipariş).");
                return logs;
            }

            int processedCargoEmails = 0;
            for (Message msgRef : messages) {
                Message message = service.users().messages().get("me", msgRef.getId()).setFormat("full").execute();
                String snippet = message.getSnippet() != null ? message.getSnippet().toLowerCase() : "";
                String subject = "";
                
                if (message.getPayload() != null && message.getPayload().getHeaders() != null) {
                    for (var header : message.getPayload().getHeaders()) {
                        if ("Subject".equalsIgnoreCase(header.getName())) {
                            subject = header.getValue();
                            break;
                        }
                    }
                }

                String bodyText = getMessageBody(message).toLowerCase();
                String searchText = subject.toLowerCase() + " " + snippet + " " + bodyText;

                String subjectLower = subject.toLowerCase();
                if (isNonCargoMarketingMail(subjectLower, searchText)) {
                    continue;
                }

                processedCargoEmails++;
                logs.add("İşleniyor: Konu: '" + subject + "' - Snippet: " + snippet);

                // 1. Search for labeled tracking numbers in full text (highest reliability - requires separator like : or =)
                Pattern pattern = Pattern.compile("(?:takip|gönderi|gonderi|barkod|kargo)\\s*(?:no|numarası|numarasi|kodu)?\\s*[:=]\\s*([A-Za-z0-9\\-]+)", Pattern.CASE_INSENSITIVE);
                Matcher matcher = pattern.matcher(searchText);
                String foundTrackingNo = null;
                if (matcher.find()) {
                    String candidate = matcher.group(1).trim();
                    candidate = candidate.replaceAll("[\\.\\-,]+$", ""); // clean trailing formatting characters
                    if (candidate.length() >= 6) {
                        foundTrackingNo = candidate;
                    }
                }

                // 2. Fallback: Search for standard 9-20 digit standalone numbers in the snippet (low noise, ignores 8-digit dates)
                if (foundTrackingNo == null) {
                    Pattern numPattern = Pattern.compile("\\b\\d{9,20}\\b");
                    Matcher numMatcher = numPattern.matcher(snippet);
                    if (numMatcher.find()) {
                        foundTrackingNo = numMatcher.group();
                    }
                }

                // 3. Fallback: Search for standard 9-20 digit standalone numbers in the full body text
                if (foundTrackingNo == null) {
                    Pattern numPattern = Pattern.compile("\\b\\d{9,20}\\b");
                    Matcher numMatcher = numPattern.matcher(bodyText);
                    if (numMatcher.find()) {
                        foundTrackingNo = numMatcher.group();
                    }
                }

                if (foundTrackingNo != null) {
                    List<Kargo> cargos = (kullaniciId != null) ? cargoRepository.findByKullaniciId(kullaniciId) : cargoRepository.findAll();
                    Kargo matchingCargo = null;
                    for (Kargo c : cargos) {
                        if (c.getKargo_takip_no() != null && c.getKargo_takip_no().equalsIgnoreCase(foundTrackingNo)) {
                            matchingCargo = c;
                            break;
                        }
                    }

                    String newStatus = "Hazırlanıyor";
                    if (searchText.contains("teslim edildi") || searchText.contains("teslim ettik") || searchText.contains("teslim alındı") || searchText.contains("ulaştı") || searchText.contains("teslim edilmiştir") || searchText.contains("teslimat yapıldı") || searchText.contains("teslim edilmistir") || searchText.contains("teslim oldu")) {
                        newStatus = "Teslim Edildi";
                    } else if (searchText.contains("kargoya verildi") || searchText.contains("yola çıktı") || searchText.contains("yola cikti") || searchText.contains("dağıtımda") || searchText.contains("dagitimda") || searchText.contains("gönderildi") || searchText.contains("gonderildi") || searchText.contains("kurye dağıtımda") || searchText.contains("sevk edildi") || searchText.contains("transit halinde")) {
                        newStatus = "Kargoya Verildi / Yolda";
                    }

                    if (matchingCargo != null) {
                        String oldStatus = matchingCargo.getKargo_durumu();
                        if (!newStatus.equals(oldStatus)) {
                            matchingCargo.setKargo_durumu(newStatus);
                            cargoRepository.save(matchingCargo);
                            logs.add("GÜNCELLENDİ: Takip No: " + foundTrackingNo + " | Eski Durum: " + oldStatus + " -> Yeni Durum: " + newStatus);
                        } else {
                            logs.add("Durum Değişmedi: " + foundTrackingNo + " (" + oldStatus + ")");
                        }
                    } else {
                        // Yeni kargo tespiti
                        Kargo newCargo = new Kargo();
                        newCargo.setKargo_takip_no(foundTrackingNo);
                        newCargo.setKargo_durumu(newStatus);
                        
                        // Konuyu temizleyerek ürün adı yapıyoruz
                        String cleanName = subject.replaceAll("(?i)numaralı siparişinize ait bir kargo yolda|kargoya verildi|teslim edildi|teslim ettik|teslim edilmiştir|kargonuz yolda|siparişiniz yolda|siparişiniz teslim edildi|siparişini teslim ettik", "").replaceAll("[🎯🚀📦✨]", "").trim();
                        if (cleanName.isEmpty()) {
                            cleanName = "Yeni Kargo Siparişi";
                        }
                        newCargo.setUrun_adi(cleanName);
                        
                        Kullanici targetUser = null;
                        if (kullaniciId != null) {
                            targetUser = userRepository.findById(kullaniciId).orElse(null);
                        }
                        if (targetUser == null) {
                            List<Kullanici> users = userRepository.findAll();
                            if (users.isEmpty()) {
                                Kullanici defaultUser = new Kullanici();
                                defaultUser.setAd_soyad("Sistem Kullanıcısı");
                                defaultUser.setEmail("sistem@ortaksepet.com");
                                defaultUser.setSifre("123456");
                                defaultUser.setRol("USER");
                                defaultUser.setRating_puani(5.0);
                                defaultUser = userRepository.save(defaultUser);
                                targetUser = defaultUser;
                            } else {
                                targetUser = users.get(0);
                            }
                        }
                        newCargo.setKullanici(targetUser);
                        
                        cargoRepository.save(newCargo);
                        logs.add("YENİ KARGO EKLENDİ: " + cleanName + " (Takip No: " + foundTrackingNo + ", Durum: " + newStatus + ")");
                    }
                } else {
                    List<Kargo> cargos = (kullaniciId != null) ? cargoRepository.findByKullaniciId(kullaniciId) : cargoRepository.findAll();
                    for (Kargo c : cargos) {
                        if (c.getUrun_adi() != null && searchText.contains(c.getUrun_adi().toLowerCase())) {
                            String oldStatus = c.getKargo_durumu();
                            String newStatus = oldStatus;
                            if (searchText.contains("teslim edildi") || searchText.contains("teslim ettik") || searchText.contains("teslim alındı") || searchText.contains("ulaştı") || searchText.contains("teslim edilmiştir") || searchText.contains("teslimat yapıldı") || searchText.contains("teslim edilmistir") || searchText.contains("teslim oldu")) {
                                newStatus = "Teslim Edildi";
                            } else if (searchText.contains("kargoya verildi") || searchText.contains("yola çıktı") || searchText.contains("yola cikti") || searchText.contains("dağıtımda") || searchText.contains("dagitimda") || searchText.contains("gönderildi") || searchText.contains("gonderildi") || searchText.contains("kurye dağıtımda") || searchText.contains("sevk edildi") || searchText.contains("transit halinde")) {
                                newStatus = "Kargoya Verildi / Yolda";
                            }
                            if (!newStatus.equals(oldStatus)) {
                                c.setKargo_durumu(newStatus);
                                cargoRepository.save(c);
                                logs.add("GÜNCELLENDİ (Ürün Adı ile): " + c.getUrun_adi() + " | Eski Durum: " + oldStatus + " -> Yeni Durum: " + newStatus);
                            }
                        }
                    }
                }
            }

            logs.add(0, "Bulunan e-posta sayısı: " + processedCargoEmails);
            if (processedCargoEmails == 0) {
                logs.add("Kargo ile ilişkili e-posta bulunamadı. Kampanya, uçuş, menü ve bülten mailleri filtrelendi.");
            }

        } catch (Exception e) {
            logs.add("Gmail API Senkronizasyon Hatası: " + e.getMessage());
            e.printStackTrace();
        }

        return logs;
    }

    private boolean isNonCargoMarketingMail(String subject, String snippet) {
        String text = (subject + " " + snippet).toLowerCase();
        String[] blockedKeywords = {
                "pegasus",
                "uçuş",
                "ucus",
                "uçak",
                "bilet",
                "boarding",
                "check-in",
                "cafe",
                "menü",
                "menu",
                "damak tad",
                "kampanya",
                "indirim",
                "fırsat",
                "firsat",
                "bülten",
                "bulten",
                "hediye",
                "promosyon"
        };

        for (String keyword : blockedKeywords) {
            if (text.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String getMessageBody(Message message) {
        if (message == null || message.getPayload() == null) {
            return "";
        }
        StringBuilder body = new StringBuilder();
        // Try to find text/plain parts first
        boolean foundPlain = extractBodyPartsByMimeType(message.getPayload(), "text/plain", body);
        if (!foundPlain) {
            // Fallback to text/html
            StringBuilder htmlBody = new StringBuilder();
            extractBodyPartsByMimeType(message.getPayload(), "text/html", htmlBody);
            // Simple HTML tag removal
            String cleanText = htmlBody.toString().replaceAll("<[^>]*>", " ");
            body.append(cleanText);
        }
        return body.toString();
    }

    private boolean extractBodyPartsByMimeType(com.google.api.services.gmail.model.MessagePart part, String mimeType, StringBuilder body) {
        if (part == null) {
            return false;
        }
        boolean found = false;
        if (mimeType.equalsIgnoreCase(part.getMimeType()) && part.getBody() != null && part.getBody().getData() != null) {
            try {
                // Base64URL decode
                byte[] decoded = java.util.Base64.getUrlDecoder().decode(part.getBody().getData());
                body.append(new String(decoded, java.nio.charset.StandardCharsets.UTF_8));
                return true;
            } catch (IllegalArgumentException e) {
                // Try standard base64 if url decoder fails
                try {
                    byte[] decoded = java.util.Base64.getDecoder().decode(part.getBody().getData());
                    body.append(new String(decoded, java.nio.charset.StandardCharsets.UTF_8));
                    return true;
                } catch (Exception ignored) {}
            }
        }
        if (part.getParts() != null) {
            for (com.google.api.services.gmail.model.MessagePart subPart : part.getParts()) {
                if (extractBodyPartsByMimeType(subPart, mimeType, body)) {
                    found = true;
                }
            }
        }
        return found;
    }
}
