/**
 * KargoRepository: Kargo entity'si için veritabanı CRUD ve kullanıcı bazlı kargo sorgulama
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.Kargo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KargoRepository extends JpaRepository<Kargo, Long> {
    List<Kargo> findByKullaniciId(Long kullaniciId);
}
