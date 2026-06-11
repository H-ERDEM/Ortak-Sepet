/**
 * GrupSohbetMesajRepository: GrupSohbetMesaji entity'si için veritabanı CRUD ve gruba göre sıralı mesaj getirme
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.GrupSohbetMesaji;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GrupSohbetMesajRepository extends JpaRepository<GrupSohbetMesaji, Long> {
    List<GrupSohbetMesaji> findByGroupIdOrderByTimeAsc(Long groupId);
}
