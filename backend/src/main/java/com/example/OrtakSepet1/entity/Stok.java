/**
 * Stok: Kullanıcıların kişisel envanterlerindeki ürünlerin miktarlarını, kategorilerini,
 * ölçü birimlerini ve kritik stok eşiği limitlerini saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "stocks")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Stok {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    private String urun_adi;
    private Integer miktar;
    private Integer kritik_esik;
    private String birim = "adet";
    private String kategori;
    private String kargo_takip_no;
    private String kargo_durumu;
}
