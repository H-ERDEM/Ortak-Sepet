/**
 * Urun: Trendyol, Hepsiburada veya Google Shopping platformlarından canlı olarak taranan
 * veya sistemde kayıtlı olan ürünlerin ad, platform, fiyat, URL ve görsel bilgilerini saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Urun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String urun_adi;
    private String platform_adi;
    private Double guncel_fiyat;
    @Column(columnDefinition = "TEXT")
    private String urun_url;
    @Column(columnDefinition = "TEXT")
    private String resim_url;
    private String brand;
    private String category;
    private String kategori_id;
}
