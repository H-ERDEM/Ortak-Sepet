/**
 * GrupRepository: Grup entity'si için veritabanı CRUD ve grup adı aramaları
 * işlemlerini gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.Grup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GrupRepository extends JpaRepository<Grup, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT g FROM Grup g WHERE LOWER(g.grup_adi) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Grup> searchByGrupAdi(String name);
}
