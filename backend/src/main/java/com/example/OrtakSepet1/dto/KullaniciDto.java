/**
 * KullaniciDto: Sistemdeki kullanıcı profillerinin şifre dışındaki bilgilerini (ad, e-posta, rol vb.)
 * frontend katmanına güvenli şekilde aktarmak için kullanılan veri transfer nesnesidir.
 */
package com.example.OrtakSepet1.dto;

import lombok.Data;

@Data
public class KullaniciDto {
    private Long id;
    private String ad_soyad;
    private String email;
    private String telefon;
    private String rol;
    private Double rating_puani;
}
