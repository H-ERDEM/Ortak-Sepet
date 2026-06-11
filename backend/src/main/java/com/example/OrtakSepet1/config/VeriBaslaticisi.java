/**
 * VeriBaslaticisi: Uygulama ilk kez ayağa kalktığında veritabanında gerekli olan
 * varsayılan verileri (örneğin admin ve örnek test kullanıcıları) oluşturan başlatıcı sınıftır.
 */
package com.example.OrtakSepet1.config;

import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class VeriBaslaticisi implements CommandLineRunner {

    private final KullaniciRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public VeriBaslaticisi(KullaniciRepository userRepository, BCryptPasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        Optional<Kullanici> adminOpt = userRepository.findByEmail("admin@ortaksepet.com");
        if (adminOpt.isEmpty()) {
            Kullanici admin = new Kullanici();
            admin.setAd_soyad("Sistem Yöneticisi");
            admin.setEmail("admin@ortaksepet.com");
            admin.setSifre(passwordEncoder.encode("admin123"));
            admin.setRol("ADMIN");
            admin.setTelefon("05555555555");
            admin.setRating_puani(5.0);
            admin.setTema_tercihi("dark");
            userRepository.save(admin);
            System.out.println("[INIT] Default admin user created (hashed): admin@ortaksepet.com / admin123");
        } else {
            Kullanici admin = adminOpt.get();
            boolean changed = false;
            if (!"ADMIN".equals(admin.getRol())) {
                admin.setRol("ADMIN");
                changed = true;
            }
           
            if (admin.getSifre() != null && !admin.getSifre().startsWith("$2a$") && !admin.getSifre().startsWith("$2b$")) {
                admin.setSifre(passwordEncoder.encode(admin.getSifre()));
                changed = true;
            }
            if (changed) {
                userRepository.save(admin);
                System.out.println("[INIT] Updated existing admin user properties/password");
            }
        }
    }
}
