/**
 * StokRepository: Stok entity'si için veritabanı CRUD ve kullanıcı bazlı envanter listeleme
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.Stok;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StokRepository extends JpaRepository<Stok, Long> {
    List<Stok> findByKullaniciId(Long kullaniciId);
}
