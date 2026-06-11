/**
 * UrunController: Canlı ürün arama (scraping) ve karşılaştırma 
 * isteklerini başlatan REST denetleyicisidir.
 */
package com.example.OrtakSepet1.controller;

import com.example.OrtakSepet1.entity.Urun;
import com.example.OrtakSepet1.service.VeriCekmeServisi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:3000")
public class UrunController {

    @Autowired
    private VeriCekmeServisi scraperService;

    @GetMapping("/search")
    public ResponseEntity<List<Urun>> searchProducts(@RequestParam String q) {
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        List<Urun> results = scraperService.searchProducts(q);
        return ResponseEntity.ok(results);
    }
}
