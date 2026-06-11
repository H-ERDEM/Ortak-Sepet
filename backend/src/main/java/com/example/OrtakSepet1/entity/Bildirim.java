/**
 * Bildirim: Kullanıcılara gönderilen fiyat alarmı güncellemeleri veya grup aktiviteleri gibi
 * uyarı/bilgilendirme kayıtlarını temsil eden JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Bildirim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "kullanici_id", nullable = false)
    @JsonIgnoreProperties({"sifre", "gmail_token"})
    private Kullanici kullanici;

    private String baslik;

    @Column(length = 1024)
    private String mesaj;

    private String link;
    private Boolean okundu = false;

    private LocalDateTime olusturma_tarihi = LocalDateTime.now();
}
