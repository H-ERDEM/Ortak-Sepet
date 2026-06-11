/**
 * DestekTalebiController: Kullanıcılardan gelen destek ve iletişim formlarını alan, listeleyen,
 * durumunu güncelleyen ve silen REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.DestekTalebi;
import com.example.OrtakSepet1.entity.Bildirim;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.BildirimRepository;
import com.example.OrtakSepet1.repository.DestekTalebiRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/support")
public class DestekTalebiController {

    private final DestekTalebiRepository supportRequestRepository;
    private final KullaniciRepository userRepository;
    private final BildirimRepository notificationRepository;

    public DestekTalebiController(
            DestekTalebiRepository supportRequestRepository,
            KullaniciRepository userRepository,
            BildirimRepository notificationRepository
    ) {
        this.supportRequestRepository = supportRequestRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<DestekTalebi>> getAllSupportRequests(
            @RequestParam(required = false) Long kullaniciId,
            @RequestParam(required = false) String email
    ) {
        if (kullaniciId != null) {
            return ResponseEntity.ok(supportRequestRepository.findByKullaniciIdOrderByNewest(kullaniciId));
        }
        if (email != null && !email.isBlank()) {
            return ResponseEntity.ok(supportRequestRepository.findByEmailOrderByNewest(email));
        }
        return ResponseEntity.ok(supportRequestRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createSupportRequest(@RequestBody DestekTalebi request) {
        if (isBlank(request.getAd_soyad()) || isBlank(request.getEmail()) || isBlank(request.getKonu()) || isBlank(request.getMesaj())) {
            return ResponseEntity.badRequest().body("Ad soyad, e-posta, konu ve mesaj alanları zorunludur.");
        }

        request.setAd_soyad(request.getAd_soyad().trim());
        request.setEmail(request.getEmail().trim());
        request.setKonu(request.getKonu().trim());
        request.setMesaj(request.getMesaj().trim());

        if (request.getDurum() == null || request.getDurum().isBlank()) {
            request.setDurum("BEKLIYOR");
        }
        if (request.getKullanici() != null && request.getKullanici().getId() != null) {
            userRepository.findById(request.getKullanici().getId()).ifPresent(request::setKullanici);
        }
        DestekTalebi saved = supportRequestRepository.save(request);
        return ResponseEntity.ok(saved);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<DestekTalebi> updateSupportStatus(@PathVariable Long id, @RequestParam String durum) {
        return supportRequestRepository.findById(id).map(request -> {
            String normalizedStatus = durum == null ? "BEKLIYOR" : durum.toUpperCase();
            if (!normalizedStatus.equals("BEKLIYOR") && !normalizedStatus.equals("INCELENIYOR") && !normalizedStatus.equals("COZULDU")) {
                return ResponseEntity.badRequest().<DestekTalebi>build();
            }
            String previousStatus = request.getDurum() == null ? "BEKLIYOR" : request.getDurum();
            request.setDurum(normalizedStatus);
            DestekTalebi saved = supportRequestRepository.save(request);
            if (!previousStatus.equals(normalizedStatus) && saved.getKullanici() != null) {
                createSupportNotification(saved, normalizedStatus);
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    private void createSupportNotification(DestekTalebi request, String status) {
        Bildirim notification = new Bildirim();
        Kullanici user = request.getKullanici();
        notification.setKullanici(user);
        notification.setBaslik("Destek talebiniz güncellendi");
        notification.setMesaj("\"" + request.getKonu() + "\" konulu talebiniz " + getStatusLabel(status) + " durumuna alındı.");
        notification.setLink("/contact");
        notificationRepository.save(notification);
    }

    private String getStatusLabel(String status) {
        if ("INCELENIYOR".equals(status)) {
            return "İnceleniyor";
        }
        if ("COZULDU".equals(status)) {
            return "Çözüldü";
        }
        return "Bekliyor";
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSupportRequest(@PathVariable Long id) {
        if (supportRequestRepository.existsById(id)) {
            supportRequestRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
