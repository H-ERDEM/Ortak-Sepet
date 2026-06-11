package com.example.OrtakSepet1;

import com.example.OrtakSepet1.entity.FiyatAlarmi;
import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.FiyatAlarmiRepository;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import com.example.OrtakSepet1.controller.FiyatAlarmiController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class FiyatAlarmiServiceTests {

    @Autowired
    private FiyatAlarmiRepository alarmRepository;

    @Autowired
    private KullaniciRepository userRepository;

    @Autowired
    private FiyatAlarmiController alarmController;

    @Test
    public void testCreatePriceAlarm() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Alarm User");
        user.setEmail("alarm@test.com");
        user.setSifre("pass123");
        user = userRepository.save(user);

        FiyatAlarmi alarm = new FiyatAlarmi();
        alarm.setKullanici(user);
        alarm.setUrun_adi("Test Laptop");
        alarm.setHedef_fiyat(15000.0); // Corrected field mapping
        alarm.setGuncel_fiyat(18000.0);
        alarm.setPlatform_adi("Trendyol");
        alarm.setUrun_url("https://trendyol.com/test-laptop");
        alarm.setBildirim_turu("E-posta");

        // Act
        ResponseEntity<FiyatAlarmi> response = alarmController.createAlarm(alarm);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        FiyatAlarmi savedAlarm = response.getBody();
        assertNotNull(savedAlarm);
        assertNotNull(savedAlarm.getId());
        assertEquals("Test Laptop", savedAlarm.getUrun_adi());
        assertEquals(user.getId(), savedAlarm.getKullanici().getId());
    }

    @Test
    public void testGetAlarmsByUserId() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Query User");
        user.setEmail("query@test.com");
        user.setSifre("pass123");
        user = userRepository.save(user);

        FiyatAlarmi alarm1 = new FiyatAlarmi();
        alarm1.setKullanici(user);
        alarm1.setUrun_adi("Phone");
        alarm1.setHedef_fiyat(5000.0);
        alarmRepository.save(alarm1);

        FiyatAlarmi alarm2 = new FiyatAlarmi();
        alarm2.setKullanici(user);
        alarm2.setUrun_adi("Tablet");
        alarm2.setHedef_fiyat(8000.0);
        alarmRepository.save(alarm2);

        // Act
        ResponseEntity<List<FiyatAlarmi>> response = alarmController.getAllAlarms(user.getId());

        // Assert
        assertEquals(200, response.getStatusCode().value());
        List<FiyatAlarmi> userAlarms = response.getBody();
        assertNotNull(userAlarms);
        assertEquals(2, userAlarms.size());
    }

    @Test
    public void testDeleteAlarm() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Delete User");
        user.setEmail("delete@test.com");
        user.setSifre("pass123");
        user = userRepository.save(user);

        FiyatAlarmi alarm = new FiyatAlarmi();
        alarm.setKullanici(user);
        alarm.setUrun_adi("Trashable Item");
        alarm.setHedef_fiyat(100.0);
        alarm = alarmRepository.save(alarm);

        // Act - Delete
        ResponseEntity<Void> deleteResponse = alarmController.deleteAlarm(alarm.getId());

        // Assert
        assertEquals(200, deleteResponse.getStatusCode().value());
        assertFalse(alarmRepository.existsById(alarm.getId()));
    }
}
