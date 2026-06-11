/**
 * UrunDto: Farklı e-ticaret sitelerinden taranan veya sistemde saklanan genel ürün
 * bilgilerini ve canlı fiyatlarını taşımak için kullanılan veri transfer nesnesidir.
 */
package com.example.OrtakSepet1.dto;

import lombok.Data;

@Data
public class UrunDto {
    private Long id;
    private String urun_adi;
    private String platform_adi;
    private Double guncel_fiyat;
    private String urun_url;
    private String resim_url;
    private String brand;
    private String category;
}
