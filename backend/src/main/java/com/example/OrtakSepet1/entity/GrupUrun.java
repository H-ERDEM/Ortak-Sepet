/**
 * GrupUrun: İmece gruplarının ortak sepetine eklenen ürünleri, adetlerini, fiyatlarını
 * ve ürünü ekleyen kullanıcının bilgisini saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "group_products")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class GrupUrun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String urunAdi;
    private BigDecimal guncelFiyat;
    @Column(columnDefinition = "TEXT")
    private String urunUrl;
    @Column(columnDefinition = "TEXT")
    private String resimUrl;
    private String platformAdi;
    private Long ekleyenKullaniciId;
    private Integer miktar;

    @ManyToOne
    @JoinColumn(name = "group_id")
    private Grup group;
}
