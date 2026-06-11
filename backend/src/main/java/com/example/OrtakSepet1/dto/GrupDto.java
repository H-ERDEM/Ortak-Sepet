/**
 * GrupDto: İmece gruplarına ait verileri ağ üzerinde taşımak ve
 * frontend-backend arasında güvenli bir şekilde transfer etmek için kullanılan veri transfer nesnesidir.
 */
package com.example.OrtakSepet1.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import lombok.Data;

@Data
public class GrupDto {
    private Long id;
    private Long lider_id;
    private String grup_adi;
    private String lokasyon_etiketi;
    private String lokasyon_adresi;
    private Double lokasyon_lat;
    private Double lokasyon_lng;
    private Double min_rating_sarti;
    private String aciklama;
    private LocalDateTime olusturma_tarihi;
    private String iban;
    private BigDecimal totalPrice;
    private String inviteCode;
    private String status;
    private List<KullaniciDto> members;
    private List<GrupUrunDto> products;
    // Optional prefill product when creating a group (frontend may pass a single product to add atomically)
    private GrupUrunDto prefillProduct;
}
