/**
 * FiyatAlarmiController: Kullanıcıların fiyat alarm isteklerini alan, 
 * listeyen ve silen REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.FiyatAlarmi;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.FiyatAlarmiRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alarms")
public class FiyatAlarmiController {

    private final FiyatAlarmiRepository priceAlarmRepository;
    private final KullaniciRepository userRepository;

    public FiyatAlarmiController(FiyatAlarmiRepository priceAlarmRepository, KullaniciRepository userRepository) {
        this.priceAlarmRepository = priceAlarmRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<FiyatAlarmi>> getAllAlarms(@RequestParam(required = false) Long kullaniciId) {
        if (kullaniciId != null) {
            return ResponseEntity.ok(priceAlarmRepository.findByKullaniciId(kullaniciId));
        }
        return ResponseEntity.ok(priceAlarmRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<FiyatAlarmi> createAlarm(@RequestBody FiyatAlarmi alarm) {
        if (alarm.getKullanici() == null || alarm.getKullanici().getId() == null) {
            List<Kullanici> users = userRepository.findAll();
            if (users.isEmpty()) {
                Kullanici defaultUser = new Kullanici();
                defaultUser.setAd_soyad("Sistem Kullanıcısı");
                defaultUser.setEmail("sistem@ortaksepet.com");
                defaultUser.setSifre("123456");
                defaultUser.setRol("USER");
                defaultUser.setRating_puani(5.0);
                defaultUser = userRepository.save(defaultUser);
                alarm.setKullanici(defaultUser);
            } else {
                alarm.setKullanici(users.get(0));
            }
        } else {
            userRepository.findById(alarm.getKullanici().getId()).ifPresent(alarm::setKullanici);
        }

        FiyatAlarmi saved = priceAlarmRepository.save(alarm);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAlarm(@PathVariable Long id) {
        if (priceAlarmRepository.existsById(id)) {
            priceAlarmRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
