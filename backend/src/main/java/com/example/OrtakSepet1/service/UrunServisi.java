/**
 * UrunServisi: Ürün veritabanı kayıtlarının (canlı aranan veya veritabanına eklenen) yönetimini üstlenen servis sınıfıdır.
 */
package com.example.OrtakSepet1.service;

import com.example.OrtakSepet1.dto.UrunDto;
import com.example.OrtakSepet1.entity.Urun;
import com.example.OrtakSepet1.repository.UrunRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UrunServisi {

    @Autowired
    private UrunRepository productRepository;

    // Create a new product
    public UrunDto createProduct(UrunDto dto) {
        Urun product = new Urun();
        product.setUrun_adi(dto.getUrun_adi());
        product.setPlatform_adi(dto.getPlatform_adi());
        product.setGuncel_fiyat(dto.getGuncel_fiyat());
        product.setUrun_url(dto.getUrun_url());
        product.setResim_url(dto.getResim_url());
        // new fields
        try {
            java.lang.reflect.Field brandField = Urun.class.getDeclaredField("brand");
            brandField.setAccessible(true);
            brandField.set(product, dto.getClass().getMethod("getBrand").invoke(dto));
        } catch (Exception ignored) {}
        try {
            java.lang.reflect.Field categoryField = Urun.class.getDeclaredField("category");
            categoryField.setAccessible(true);
            categoryField.set(product, dto.getClass().getMethod("getCategory").invoke(dto));
        } catch (Exception ignored) {}
        Urun saved = productRepository.save(product);
        return mapToDto(saved);
    }

    // Get all products
    public List<UrunDto> getAllProducts() {
        return productRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // Search by name (urun_adi) containing keyword (case‑insensitive)
    public List<UrunDto> searchByName(String keyword) {
        return productRepository.findAll().stream()
                .filter(p -> p.getUrun_adi() != null && p.getUrun_adi().toLowerCase().contains(keyword.toLowerCase()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private UrunDto mapToDto(Urun p) {
        UrunDto dto = new UrunDto();
        dto.setId(p.getId());
        dto.setUrun_adi(p.getUrun_adi());
        dto.setPlatform_adi(p.getPlatform_adi());
        dto.setGuncel_fiyat(p.getGuncel_fiyat());
        dto.setUrun_url(p.getUrun_url());
        dto.setResim_url(p.getResim_url());
        // reflect new fields if present
        try {
            java.lang.reflect.Field brandField = Urun.class.getDeclaredField("brand");
            brandField.setAccessible(true);
            dto.getClass().getMethod("setBrand", String.class).invoke(dto, brandField.get(p));
        } catch (Exception ignored) {}
        try {
            java.lang.reflect.Field categoryField = Urun.class.getDeclaredField("category");
            categoryField.setAccessible(true);
            dto.getClass().getMethod("setCategory", String.class).invoke(dto, categoryField.get(p));
        } catch (Exception ignored) {}
        return dto;
    }
}
