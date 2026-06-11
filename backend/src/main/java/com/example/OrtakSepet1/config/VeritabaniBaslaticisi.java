/**
 * VeritabaniBaslaticisi: Uygulama ayağa kalktığında veritabanında yer alan envanter/stok
 * verilerini kontrol ederek kategorisi boş olan stok kartlarına varsayılan kategori atamasını yapar.
 */
package com.example.OrtakSepet1.config;

import com.example.OrtakSepet1.entity.Stok;
import com.example.OrtakSepet1.repository.StokRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
public class VeritabaniBaslaticisi implements CommandLineRunner {

    private final StokRepository stockRepository;
    private final JdbcTemplate jdbcTemplate;

    public VeritabaniBaslaticisi(StokRepository stockRepository, JdbcTemplate jdbcTemplate) {
        this.stockRepository = stockRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) throws Exception {
        
        try {
            jdbcTemplate.execute("ALTER TABLE group_products ALTER COLUMN urun_adi TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE group_products urun_adi already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE group_products ALTER COLUMN urun_url TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE group_products urun_url already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE group_products ALTER COLUMN resim_url TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE group_products resim_url already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN urun_adi TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE products urun_adi already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN urun_url TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE products urun_url already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE products ALTER COLUMN resim_url TYPE TEXT");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE products resim_url already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE imece_groups ALTER COLUMN grup_adi TYPE VARCHAR(500)");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE imece_groups grup_adi already updated or failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.execute("ALTER TABLE imece_groups ALTER COLUMN lokasyon_adresi TYPE VARCHAR(500)");
        } catch (Exception e) {
            System.out.println("[MIGRATION] ALTER TABLE imece_groups lokasyon_adresi already updated or failed: " + e.getMessage());
        }

        List<Stok> stocks = stockRepository.findAll();
        boolean updated = false;
        for (Stok stock : stocks) {
            if (stock.getKategori() == null || stock.getKategori().isEmpty()) {
                stock.setKategori("Diğer");
                stockRepository.save(stock);
                updated = true;
            }
        }
        if (updated) {
            System.out.println("DATABASE MIGRATION: Updated null/empty categories in stocks to 'Diğer'");
        }
    }
}
