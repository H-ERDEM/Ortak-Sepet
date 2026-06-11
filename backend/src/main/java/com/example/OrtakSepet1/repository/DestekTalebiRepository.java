/**
 * DestekTalebiRepository: DestekTalebi entity'si için veritabanı CRUD ve filtreleme (kullanıcı veya e-postaya göre)
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.DestekTalebi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DestekTalebiRepository extends JpaRepository<DestekTalebi, Long> {
    @Query("select s from DestekTalebi s where s.kullanici.id = :kullaniciId order by s.olusturma_tarihi desc")
    List<DestekTalebi> findByKullaniciIdOrderByNewest(Long kullaniciId);

    @Query("select s from DestekTalebi s where s.email = :email order by s.olusturma_tarihi desc")
    List<DestekTalebi> findByEmailOrderByNewest(String email);
}
