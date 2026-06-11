/**
 * StokController: Kullanıcıların kişisel stok/envanter kayıtlarını 
 * listeler, yeni stok ekler
 * ve mevcut stok miktarlarını günceller.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.Stok;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.StokRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stocks")
public class StokController {

    private final StokRepository stockRepository;
    private final KullaniciRepository userRepository;

    public StokController(StokRepository stockRepository, KullaniciRepository userRepository) {
        this.stockRepository = stockRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<Stok>> getAllStocks(@RequestParam(required = false) Long kullaniciId) {
        if (kullaniciId != null) {
            return ResponseEntity.ok(stockRepository.findByKullaniciId(kullaniciId));
        }
        return ResponseEntity.ok(stockRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<Stok> createStock(@RequestBody Stok stock) {
        if (stock.getKullanici() == null || stock.getKullanici().getId() == null) {
            // Find first user or throw error
            List<Kullanici> users = userRepository.findAll();
            if (users.isEmpty()) {
                // Create a default system user if none exists
                Kullanici defaultUser = new Kullanici();
                defaultUser.setAd_soyad("Sistem Kullanıcısı");
                defaultUser.setEmail("sistem@ortaksepet.com");
                defaultUser.setSifre("123456");
                defaultUser.setRol("USER");
                defaultUser.setRating_puani(5.0);
                defaultUser = userRepository.save(defaultUser);
                stock.setKullanici(defaultUser);
            } else {
                stock.setKullanici(users.get(0));
            }
        } else {
            // Resolve from DB to prevent transient/detached issues
            userRepository.findById(stock.getKullanici().getId()).ifPresent(stock::setKullanici);
        }
        
        if (stock.getKategori() == null || stock.getKategori().isEmpty()) {
            stock.setKategori("Diğer");
        }
        if (stock.getBirim() == null || stock.getBirim().isBlank()) {
            stock.setBirim("adet");
        }
        
        Stok saved = stockRepository.save(stock);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Stok> updateStock(@PathVariable Long id, @RequestBody Stok stockDetails) {
        return stockRepository.findById(id).map(stock -> {
            stock.setUrun_adi(stockDetails.getUrun_adi());
            stock.setMiktar(stockDetails.getMiktar());
            stock.setKritik_esik(stockDetails.getKritik_esik());
            if (stockDetails.getBirim() != null && !stockDetails.getBirim().isBlank()) {
                stock.setBirim(stockDetails.getBirim());
            }
            if (stockDetails.getKategori() != null) {
                stock.setKategori(stockDetails.getKategori());
            }
            if (stockDetails.getKargo_takip_no() != null) {
                stock.setKargo_takip_no(stockDetails.getKargo_takip_no());
            }
            if (stockDetails.getKargo_durumu() != null) {
                stock.setKargo_durumu(stockDetails.getKargo_durumu());
            }
            Stok updated = stockRepository.save(stock);
            return ResponseEntity.ok(updated);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStock(@PathVariable Long id) {
        if (stockRepository.existsById(id)) {
            stockRepository.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
