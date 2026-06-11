/**
 * KargoController: Canlı kargo takip girdilerini yönetir, 
 * Google hesabı yetkilendirme linklerini yönlendirir
 * ve Gmail inbox senkronizasyonunu tetikler.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.Kargo;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.KargoRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import com.example.OrtakSepet1.service.GmailCanliTakipServisi;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cargos")
public class KargoController {

    private final GmailCanliTakipServisi gmailLiveTrackingService;
    private final KargoRepository cargoRepository;
    private final KullaniciRepository userRepository;

    public KargoController(GmailCanliTakipServisi gmailLiveTrackingService,
                           KargoRepository cargoRepository,
                           KullaniciRepository userRepository) {
        this.gmailLiveTrackingService = gmailLiveTrackingService;
        this.cargoRepository = cargoRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Kargo>> getAllCargos(@RequestParam(required = false) Long kullaniciId) {
        if (kullaniciId != null) {
            return ResponseEntity.ok(cargoRepository.findByKullaniciId(kullaniciId));
        }
        return ResponseEntity.ok(cargoRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Kargo> createCargo(@RequestBody Kargo cargo) {
        if (cargo.getKullanici() == null || cargo.getKullanici().getId() == null) {
            List<Kullanici> users = userRepository.findAll();
            if (users.isEmpty()) {
                Kullanici defaultUser = new Kullanici();
                defaultUser.setAd_soyad("Sistem Kullanıcısı");
                defaultUser.setEmail("sistem@ortaksepet.com");
                defaultUser.setSifre("123456");
                defaultUser.setRol("USER");
                defaultUser.setRating_puani(5.0);
                defaultUser = userRepository.save(defaultUser);
                cargo.setKullanici(defaultUser);
            } else {
                cargo.setKullanici(users.get(0));
            }
        } else {
            userRepository.findById(cargo.getKullanici().getId()).ifPresent(cargo::setKullanici);
        }
        if (cargo.getKargo_durumu() == null || cargo.getKargo_durumu().isEmpty()) {
            cargo.setKargo_durumu("Hazırlanıyor");
        }
        Kargo saved = cargoRepository.save(cargo);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Kargo> updateCargo(@PathVariable Long id, @RequestBody Kargo cargoDetails) {
        return cargoRepository.findById(id).map(cargo -> {
            cargo.setUrun_adi(cargoDetails.getUrun_adi());
            cargo.setKargo_takip_no(cargoDetails.getKargo_takip_no());
            if (cargoDetails.getKargo_durumu() != null) {
                cargo.setKargo_durumu(cargoDetails.getKargo_durumu());
            }
            Kargo updated = cargoRepository.save(cargo);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCargo(@PathVariable Long id) {
        if (cargoRepository.existsById(id)) {
            cargoRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getConnectionStatus(@RequestParam(required = false) Long kullaniciId) {
        Map<String, Object> response = new HashMap<>();
        response.put("connected", gmailLiveTrackingService.isUserConnected(kullaniciId));
        return ResponseEntity.ok(response);
    }

    @GetMapping("/google/connect")
    public void connectGoogle(
            @RequestParam(required = false) String redirect,
            @RequestParam(required = false) Long userId,
            HttpServletRequest request,
            HttpServletResponse response
    ) throws IOException {
        if (redirect != null && (redirect.startsWith("http://localhost:3000") || redirect.startsWith("http://localhost:3001"))) {
            request.getSession().setAttribute("oauthRedirectUrl", redirect);
        }
        if (userId != null) {
            request.getSession().setAttribute("oauthUserId", userId);
        }
        response.sendRedirect("/oauth2/authorization/google");
    }

    @PostMapping("/google/disconnect")
    public ResponseEntity<Map<String, Object>> disconnectGoogle(@RequestParam(required = false) Long userId) {
        if (userId != null) {
            userRepository.findById(userId).ifPresent(user -> {
                user.setGmail_token(null);
                userRepository.save(user);
            });
        }
        gmailLiveTrackingService.setOAuth2Details(null, null, null);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sync")
    public ResponseEntity<List<String>> syncEmails(@RequestParam(required = false) Long kullaniciId) {
        List<String> logs = gmailLiveTrackingService.syncGmailInbox(kullaniciId);
        return ResponseEntity.ok(logs);
    }
}
