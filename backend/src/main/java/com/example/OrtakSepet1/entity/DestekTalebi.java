/**
 * DestekTalebi: İletişim sayfasından kullanıcıların gönderdiği soru, talep veya hata bildirimlerini
 * ve adminlerin verdiği yanıtları veritabanında saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_requests")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class DestekTalebi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ad_soyad;
    private String email;
    private String konu;
    private String durum = "BEKLIYOR";

    @ManyToOne
    @JoinColumn(name = "kullanici_id")
    @JsonIgnoreProperties({"sifre", "gmail_token"})
    private Kullanici kullanici;
    
    @Column(length = 2048)
    private String mesaj;

    private LocalDateTime olusturma_tarihi;

    @PrePersist
    public void prePersist() {
        if (olusturma_tarihi == null) {
            olusturma_tarihi = LocalDateTime.now();
        }
    }
}
