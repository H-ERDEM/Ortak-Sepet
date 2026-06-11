/**
 * UrunRepository: Urun entity'si için veritabanı CRUD ve URL bazlı ürün arama
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.Urun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UrunRepository extends JpaRepository<Urun, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT u FROM Urun u WHERE u.urun_url = ?1")
    java.util.Optional<Urun> findByUrunUrl(String urunUrl);
}
