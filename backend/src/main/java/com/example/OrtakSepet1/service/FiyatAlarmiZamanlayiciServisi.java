/**
 * FiyatAlarmiZamanlayiciServisi: Takip listesindeki ürünleri periyodik olarak (cron job) yeniden tarar.
 * Hedeflenen fiyat eşiği aşıldığında veya fiyatta değişiklik olduğunda sistem bildirimi tetikler.
 */
package com.example.OrtakSepet1.service;

import com.example.OrtakSepet1.entity.FiyatAlarmi;
import com.example.OrtakSepet1.entity.Urun;
import com.example.OrtakSepet1.entity.Bildirim;
import com.example.OrtakSepet1.repository.FiyatAlarmiRepository;
import com.example.OrtakSepet1.repository.BildirimRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FiyatAlarmiZamanlayiciServisi {

    @Autowired
    private FiyatAlarmiRepository priceAlarmRepository;

    @Autowired
    private BildirimRepository notificationRepository;

    @Autowired
    private VeriCekmeServisi scraperService;

    // Checks prices based on the configured cron rate (default: every 6 hours)
    @Scheduled(cron = "${price.alarm.cron:0 0 */6 * * *}")
    public void checkAllPriceAlarms() {
        System.out.println("[SCHEDULER] Fiyat alarmları taranıyor...");
        List<FiyatAlarmi> alarms = priceAlarmRepository.findAll();
        
        if (alarms.isEmpty()) {
            System.out.println("[SCHEDULER] Takipte olan fiyat alarmı bulunmuyor.");
            return;
        }

        for (FiyatAlarmi alarm : alarms) {
            try {
                System.out.println("[SCHEDULER] Arama yapılıyor: " + alarm.getUrun_adi() + " (" + alarm.getPlatform_adi() + ")");
                
                // Fetch scraped products
                List<Urun> results = scraperService.searchProducts(alarm.getUrun_adi());
                
                Urun matchingProduct = null;
                for (Urun p : results) {
                    if (p.getPlatform_adi() != null && p.getPlatform_adi().equalsIgnoreCase(alarm.getPlatform_adi())) {
                        matchingProduct = p;
                        break;
                    }
                }

                if (matchingProduct != null && matchingProduct.getGuncel_fiyat() != null && matchingProduct.getGuncel_fiyat() > 0) {
                    Double newPrice = matchingProduct.getGuncel_fiyat();
                    Double oldPrice = alarm.getGuncel_fiyat();
                    
                    if (!newPrice.equals(oldPrice)) {
                        alarm.setGuncel_fiyat(newPrice);
                        priceAlarmRepository.save(alarm);
                        System.out.println("[SCHEDULER] Alarm Fiyatı Güncellendi. Ürün: " + alarm.getUrun_adi() + " | Eski: " + oldPrice + " TL -> Yeni: " + newPrice + " TL");
                    }

                    // Check if target is met
                    if (newPrice <= alarm.getHedef_fiyat()) {
                        System.out.println("[ALARM TETİKLENDİ] !!! DÜŞÜK FİYAT UYARISI !!!");
                        System.out.println("Ürün: " + alarm.getUrun_adi());
                        System.out.println("Platform: " + alarm.getPlatform_adi());
                        System.out.println("Hedef Fiyat: " + alarm.getHedef_fiyat() + " TL | Güncel Fiyat: " + newPrice + " TL");
                        System.out.println("Kullanıcı: " + alarm.getKullanici().getEmail());
                        System.out.println("----------------------------------------------");
                        
                        try {
                            Bildirim notification = new Bildirim();
                            notification.setKullanici(alarm.getKullanici());
                            notification.setBaslik("Fiyat Alarmı Tetiklendi!");
                            notification.setMesaj("\"" + alarm.getUrun_adi() + "\" ürünü " + alarm.getPlatform_adi() + 
                                                   " platformunda hedeflediğiniz fiyata düştü! " +
                                                   "Hedef: " + alarm.getHedef_fiyat() + " TL | Güncel: " + newPrice + " TL");
                            notification.setLink("/alarms");
                            notificationRepository.save(notification);
                            System.out.println("[ALARM TETİKLENDİ] Kullanıcı için bildirim başarıyla oluşturuldu.");
                        } catch (Exception ne) {
                            System.err.println("[SCHEDULER] Bildirim oluşturma hatası: " + ne.getMessage());
                        }
                    }
                } else {
                    System.out.println("[SCHEDULER] Ürün için " + alarm.getPlatform_adi() + " platformunda güncel fiyat bilgisi bulunamadı.");
                }
                
                // Avoid fast scraping triggers by pausing briefly between products
                Thread.sleep(2000);
            } catch (Exception e) {
                System.err.println("[SCHEDULER] Alarm kontrol hatası (" + alarm.getUrun_adi() + "): " + e.getMessage());
            }
        }
        System.out.println("[SCHEDULER] Fiyat alarmları tarama işlemi tamamlandı.");
    }
}
