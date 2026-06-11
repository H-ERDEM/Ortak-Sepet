/**
 * GrupUrunDto: Grupların sepetine eklenen ürünlerin bilgilerini, miktarlarını ve
 * ekleyen üye ID'lerini taşımak için kullanılan veri transfer nesnesidir.
 */
package com.example.OrtakSepet1.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class GrupUrunDto {
    private Long id;
    private String urunAdi;
    private BigDecimal guncelFiyat;
    private String urunUrl;
    private String resimUrl;
    private String platformAdi;
    private Long ekleyenKullaniciId;
    private Integer miktar;
}
