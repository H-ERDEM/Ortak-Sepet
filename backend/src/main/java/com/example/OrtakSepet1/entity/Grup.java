/**
 * Grup: Kullanıcıların birlikte toplu sipariş vermek için kurduğu İmece Gruplarını,
 * konum, IBAN, katılım koşulları ve durum bilgilerini tutan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "imece_groups")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Grup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "lider_id", nullable = false)
    private Kullanici lider;

    @Column(length = 500)
    private String grup_adi;
    private String lokasyon_etiketi;
    @Column(length = 500)
    private String lokasyon_adresi;
    private Double lokasyon_lat;
    private Double lokasyon_lng;
    private Double min_rating_sarti;
    @Column(columnDefinition = "TEXT")
    private String aciklama;
    private LocalDateTime olusturma_tarihi;
    private String iban;

    private java.math.BigDecimal totalPrice;
    private java.util.UUID inviteCode;
    @Enumerated(EnumType.STRING)
    private com.example.OrtakSepet1.enums.GrupDurumu status;

    @ManyToMany
    @JoinTable(name = "group_members",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id"))
    private java.util.Set<Kullanici> members = new java.util.HashSet<>();

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.Set<com.example.OrtakSepet1.entity.GrupUrun> products = new java.util.HashSet<>();
}
