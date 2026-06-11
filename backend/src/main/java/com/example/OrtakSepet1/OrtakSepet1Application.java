/**
 * OrtakSepet1Application: OrtakSepet Spring Boot uygulamasının ana giriş noktasıdır (Entry Point).
 * Uygulamanın başlatılmasını sağlar ve periyodik görevlerin (@EnableScheduling) çalıştırılmasını aktif hale getirir.
 */
package com.example.OrtakSepet1;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OrtakSepet1Application {

	public static void main(String[] args) {
		SpringApplication.run(OrtakSepet1Application.class, args);
	}

}
