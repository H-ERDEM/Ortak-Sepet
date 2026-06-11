/**
 * Kullanici: Sisteme kayıtlı kullanıcıların ad-soyad, e-posta, şifre (BCrypt hash),
 * rol (USER/ADMIN), telefon numarası, rating puanı ve Gmail OAuth token bilgilerini tutan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Kullanici {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Kullanıcı benzersiz numarası

    private String ad_soyad; // Kullanıcının adı ve soyadı

    @Column(unique = true, nullable = false)
    private String email; // Kullanıcı e-posta adresi

    private String telefon; // Kullanıcının iletişim numarası

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String sifre; // Kullanıcı şifresi

    private String rol; // Kullanıcı türü

    private Double rating_puani = 5.0; // Kullanıcının önceki işlemlerinden aldığı güven puanı

    private String tema_tercihi = "light"; // Kullanıcının arayüz tercihi

    @Column(length = 1000)
    private String gmail_token; // Gmail API erişimi için OAuth 2.0 yetkilendirme anahtarı
}