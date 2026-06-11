/**
 * StokDto: Kullanıcıların kişisel envanterlerindeki ürünlerin miktarlarını ve kargo durumlarını
 * taşımak amacıyla kullanılan veri transfer nesnesidir.
 */
package com.example.OrtakSepet1.dto;

import lombok.Data;

@Data
public class StokDto {
    private Long id;
    private Long kullanici_id;
    private String urun_adi;
    private Integer miktar;
    private Integer kritik_esik;
    private String kargo_takip_no;
    private String kargo_durumu;
}
