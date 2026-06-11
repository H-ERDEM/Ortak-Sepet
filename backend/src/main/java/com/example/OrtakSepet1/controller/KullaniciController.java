/**
 * KullaniciController: Kullanıcı kayıt, giriş (login) doğrulama, kullanıcı listeleme
 * ve profil bilgilerinin güncellenmesini sağlayan REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.entity.Bildirim;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import com.example.OrtakSepet1.repository.BildirimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class KullaniciController {

    @Autowired
    private KullaniciRepository userRepository;

    @Autowired
    private BildirimRepository notificationRepository;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllUsers(@RequestParam(required = false) Long adminId) {
        if (isAdminUser(adminId)) {
            return ResponseEntity.ok(userRepository.findAll());
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body("Bu işlem için admin yetkisi gerekmektedir.");
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/kayit")
    public ResponseEntity<?> registerUser(@RequestBody Kullanici user) {
        Optional<Kullanici> existingUser = userRepository.findByEmail(user.getEmail());
        if (existingUser.isPresent()) {
            return ResponseEntity.badRequest().body("Bu e-posta adresi zaten kullanılıyor.");
        }
        
        user.setSifre(passwordEncoder.encode(user.getSifre()));
        user.setRol("USER"); // Default role to prevent self-elevation to ADMIN during registration
        Kullanici savedUser = userRepository.save(user);
        return ResponseEntity.ok(savedUser);
    }

    @PostMapping("/giris")
    public ResponseEntity<?> loginUser(@RequestBody Kullanici loginRequest) {
        Optional<Kullanici> userOpt = userRepository.findByEmail(loginRequest.getEmail());
        
        if (userOpt.isPresent()) {
            Kullanici user = userOpt.get();
            boolean passwordMatch = false;
            
            if (passwordEncoder.matches(loginRequest.getSifre(), user.getSifre())) {
                passwordMatch = true;
            } else if (user.getSifre().equals(loginRequest.getSifre())) {
                // Temporary fallback for migration phase to allow plaintext login for existing users
                user.setSifre(passwordEncoder.encode(user.getSifre()));
                userRepository.save(user);
                passwordMatch = true;
            }
            
            if (passwordMatch) {
                org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth = 
                    new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        user.getEmail(), null, java.util.Collections.singletonList(
                            new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_" + user.getRol())
                        )
                    );
                org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
                return ResponseEntity.ok(user);
            } else {
                return ResponseEntity.status(401).body("Şifre hatalı.");
            }
        }
        
        return ResponseEntity.status(404).body("Kullanıcı bulunamadı.");
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody Kullanici userDetails,
            @RequestParam(required = false) Long requesterId
    ) {
        boolean isAdminById = isAdminUser(requesterId);
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (!isAdminById && (auth == null || !auth.isAuthenticated())) {
            return ResponseEntity.status(401).body("Giriş yapmanız gerekmektedir.");
        }

        String currentEmail = auth != null ? auth.getName() : "";
        boolean isAdmin = isAdminById || (auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN")));

        return userRepository.findById(id).map(user -> {
            // Only user themselves or an admin can update
            if (!user.getEmail().equalsIgnoreCase(currentEmail) && !isAdmin) {
                return ResponseEntity.status(403).body("Başka bir kullanıcının bilgilerini güncelleyemezsiniz.");
            }

            user.setAd_soyad(userDetails.getAd_soyad());
            user.setEmail(userDetails.getEmail());
            user.setTelefon(userDetails.getTelefon());
            if (userDetails.getSifre() != null && !userDetails.getSifre().isEmpty()) {
                // If it is not already hashed, encode it
                if (!userDetails.getSifre().startsWith("$2a$") && !userDetails.getSifre().startsWith("$2b$") && userDetails.getSifre().length() < 30) {
                    user.setSifre(passwordEncoder.encode(userDetails.getSifre()));
                } else {
                    user.setSifre(userDetails.getSifre());
                }
            }
            if (userDetails.getTema_tercihi() != null) {
                user.setTema_tercihi(userDetails.getTema_tercihi());
            }
            if (userDetails.getRol() != null && !userDetails.getRol().isBlank()) {
                if (isAdmin) {
                    user.setRol(userDetails.getRol());
                }
                // Non-admins cannot modify their own or others' roles
            }
            if (userDetails.getRating_puani() != null) {
                if (isAdmin) {
                    double oldRating = user.getRating_puani() != null ? user.getRating_puani() : 5.0;
                    double rating = Math.max(1.0, Math.min(5.0, userDetails.getRating_puani()));
                    user.setRating_puani(rating);
                    if (rating < oldRating) {
                        Bildirim warning = new Bildirim();
                        warning.setKullanici(user);
                        warning.setBaslik("Güven Puanınız Düşürüldü");
                        warning.setMesaj(String.format("Güven puanınız sistem yöneticisi tarafından düşürülmüştür. Önceki: %.1f, Yeni: %.1f", oldRating, rating));
                        warning.setLink("/settings");
                        warning.setOkundu(false);
                        warning.setOlusturma_tarihi(java.time.LocalDateTime.now());
                        notificationRepository.save(warning);
                    }
                }
            }
            if (userDetails.getGmail_token() != null) {
                user.setGmail_token(userDetails.getGmail_token());
            }
            Kullanici updated = userRepository.save(user);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    private boolean isAdminUser(Long userId) {
        if (userId == null) {
            return false;
        }
        return userRepository.findById(userId)
                .map(user -> "ADMIN".equalsIgnoreCase(user.getRol()))
                .orElse(false);
    }
}
