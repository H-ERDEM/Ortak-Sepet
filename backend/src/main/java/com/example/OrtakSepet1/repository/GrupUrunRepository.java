/**
 * GrupUrunRepository: GrupUrun entity'si için veritabanı CRUD işlemlerini
 * gerçekleştiren Spring Data JPA arayüzüdür.
 */
package com.example.OrtakSepet1.repository;

import com.example.OrtakSepet1.entity.GrupUrun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GrupUrunRepository extends JpaRepository<GrupUrun, Long> {
}
