/**
 * Kargo: Kullanıcıların kargo takip numaralarını, kargo firmalarını ve
 * sipariş durumlarını (hazırlanıyor, yolda, teslim edildi) saklayan JPA entity sınıfıdır.
 */
package com.example.OrtakSepet1.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cargos")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class Kargo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "kullanici_id", nullable = false)
    private Kullanici kullanici;

    private String urun_adi;
    private String kargo_takip_no;
    private String kargo_durumu;
}
