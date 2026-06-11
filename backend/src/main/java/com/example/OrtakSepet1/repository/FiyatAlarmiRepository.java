/**
 * FiyatAlarmiRepository: FiyatAlarmi entity'si için veritabanı CRUD ve kullanıcı bazlı sorgulama
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.FiyatAlarmi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FiyatAlarmiRepository extends JpaRepository<FiyatAlarmi, Long> {
    List<FiyatAlarmi> findByKullaniciId(Long kullaniciId);
}
