/**
 * GrupController: İmece Gruplarının kurulması, katılım sağlanması, 
 * IBAN bilgisi, durum güncellemeleri
 * ve grup içi sohbet mesajlarının çekilmesi/iletilmesi işlevlerini 
 * yöneten REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.dto.GrupDto;
import com.example.OrtakSepet1.dto.GrupUrunDto;
import com.example.OrtakSepet1.dto.GrupSohbetMesajDto;
import com.example.OrtakSepet1.service.GrupServisi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@CrossOrigin(origins = "http://localhost:3000")
public class GrupController {

    @Autowired
    private GrupServisi groupService;

    // Create a group
    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody GrupDto groupDto, @RequestParam Long liderId) {
        try {
            GrupDto created = groupService.createGroup(groupDto, liderId);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // code ile katılma
    @PostMapping("/join/{code}")
    public ResponseEntity<?> joinGroup(@PathVariable String code, @RequestParam Long kullaniciId) {
        try {
            GrupDto groupDto = groupService.joinGroupWithCode(code, kullaniciId);
            return ResponseEntity.ok(groupDto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //ürün ekleme gruba
    @PostMapping("/{id}/add-product")
    public ResponseEntity<?> addProduct(@PathVariable Long id, @RequestBody GrupUrunDto productDto, @RequestParam Long kullaniciId) {
        try {
            GrupDto updated = groupService.addProductToGroup(id, productDto, kullaniciId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // durumu günceleme
    @PostMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestParam Long liderId, @RequestParam String status) {
        try {
            GrupDto updated = groupService.changeGroupStatus(id, liderId, status);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // kullanıcıyı cezalandırma 
    @PostMapping("/{id}/penalize")
    public ResponseEntity<?> penalizeUser(@PathVariable Long id, @RequestParam Long liderId, @RequestParam Long targetUserId) {
        try {
            groupService.penalizeUser(id, liderId, targetUserId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get group by ID
    @GetMapping("/{id}")
    public ResponseEntity<GrupDto> getGroupById(@PathVariable Long id) {
        try {
            GrupDto groupDto = groupService.getGroupById(id);
            return ResponseEntity.ok(groupDto);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // konuma göre arama 
    @GetMapping("/search")
    public ResponseEntity<List<GrupDto>> searchGroups(@RequestParam String lokasyon) {
        List<GrupDto> results = groupService.searchGroupsByLokasyon(lokasyon);
        return ResponseEntity.ok(results);
    }

    // tüm grupları getirme
    @GetMapping
    public ResponseEntity<List<GrupDto>> getAllGroups() {
        List<GrupDto> results = groupService.getAllGroups();
        return ResponseEntity.ok(results);
    }

    // silme 
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        try {
            groupService.deleteGroup(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    // IBAN güncelleme 
    @PostMapping("/{id}/iban")
    public ResponseEntity<?> updateIban(@PathVariable Long id, @RequestParam Long liderId, @RequestParam String iban) {
        try {
            GrupDto updated = groupService.updateGroupIban(id, liderId, iban);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // sohbet 
    @GetMapping("/{id}/chat")
    public ResponseEntity<List<GrupSohbetMesajDto>> getChatMessages(@PathVariable Long id) {
        try {
            List<GrupSohbetMesajDto> messages = groupService.getChatMessages(id);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // mesaj gönderme 
    @PostMapping("/{id}/chat")
    public ResponseEntity<?> postChatMessage(@PathVariable Long id, @RequestBody GrupSohbetMesajDto messageDto) {
        try {
            GrupSohbetMesajDto saved = groupService.saveChatMessage(id, messageDto);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // sepetten ürün çıkarma
    @DeleteMapping("/{id}/products/{productId}")
    public ResponseEntity<?> removeProduct(@PathVariable Long id, @PathVariable Long productId, @RequestParam Long kullaniciId) {
        try {
            GrupDto updated = groupService.removeProductFromGroup(id, productId, kullaniciId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
