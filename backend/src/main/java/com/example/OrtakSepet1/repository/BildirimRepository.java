/**
 * BildirimRepository: Bildirim entity'si için veritabanı CRUD ve özel sorgu (kullanıcıya göre sıralı getirme, okunmamış bildirim sayısı)
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.Bildirim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BildirimRepository extends JpaRepository<Bildirim, Long> {
    @Query("select n from Bildirim n where n.kullanici.id = :kullaniciId order by n.olusturma_tarihi desc")
    List<Bildirim> findByKullaniciIdOrderByNewest(Long kullaniciId);

    long countByKullanici_IdAndOkunduFalse(Long kullaniciId);
}
