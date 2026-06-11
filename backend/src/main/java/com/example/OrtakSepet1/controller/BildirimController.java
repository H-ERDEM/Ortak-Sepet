/**
 * BildirimController: Sistem bildirimlerinin (okundu bilgisi, okunmamış bildirim sayısı vb.) 
 * yönetilmesini sağlayan REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.Bildirim;
import com.example.OrtakSepet1.repository.BildirimRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class BildirimController {

    private final BildirimRepository notificationRepository;

    public BildirimController(BildirimRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<List<Bildirim>> getNotifications(@RequestParam Long kullaniciId) {
        return ResponseEntity.ok(notificationRepository.findByKullaniciIdOrderByNewest(kullaniciId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam Long kullaniciId) {
        return ResponseEntity.ok(notificationRepository.countByKullanici_IdAndOkunduFalse(kullaniciId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Bildirim> markAsRead(@PathVariable Long id) {
        return notificationRepository.findById(id).map(notification -> {
            notification.setOkundu(true);
            return ResponseEntity.ok(notificationRepository.save(notification));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@RequestParam Long kullaniciId) {
        List<Bildirim> notifications = notificationRepository.findByKullaniciIdOrderByNewest(kullaniciId);
        notifications.forEach(notification -> notification.setOkundu(true));
        notificationRepository.saveAll(notifications);
        return ResponseEntity.ok().build();
    }
}
