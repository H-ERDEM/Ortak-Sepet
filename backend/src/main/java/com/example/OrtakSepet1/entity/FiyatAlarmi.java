/**
 * FiyatAlarmi: Belirli bir ürünün fiyatı kullanıcının belirlediği hedef limitin altına
 * düştüğünde tetiklenecek alarm tanımlarını saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "price_alarms")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class FiyatAlarmi {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    private String urun_adi;
    private Double hedef_fiyat;
    private Double guncel_fiyat;
    private String platform_adi;
    
    @Column(length = 2048)
    private String urun_url;
    
    @Column(length = 2048)
    private String resim_url;
    
    private String bildirim_turu; // E-posta veya Web Push
}
