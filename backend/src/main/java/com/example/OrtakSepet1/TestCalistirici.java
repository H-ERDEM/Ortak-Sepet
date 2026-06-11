/**
 * TestCalistirici: Geliştirme aşamasında Playwright veri çekme (scraping) servisini
 * doğrudan konsol üzerinden test etmek amacıyla oluşturulmuş yardımcı ana test sınıfıdır.
 */
package com.example.OrtakSepet1;

import com.example.OrtakSepet1.service.VeriCekmeServisi;

public class TestCalistirici {
    public static void main(String[] args) {
        try (VeriCekmeServisi service = new VeriCekmeServisi()) {
            service.searchProducts("iphone");
            System.out.println("SUCCESS");
        } catch (Throwable t) {
            t.printStackTrace();
        }
    }
}
