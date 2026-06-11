package com.example.OrtakSepet1;

import com.example.OrtakSepet1.entity.Kullanici;
import com.example.OrtakSepet1.repository.KullaniciRepository;
import com.example.OrtakSepet1.controller.KullaniciController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class KullaniciServiceTests {

    @Autowired
    private KullaniciRepository userRepository;

    @Autowired
    private KullaniciController userController;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Test
    public void testUserRegistrationAndHashing() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Test Auth");
        user.setEmail("auth@test.com");
        user.setSifre("mypassword123");
        user.setRol("ADMIN"); // Attempt role self-elevation

        // Act
        ResponseEntity<?> response = userController.registerUser(user);

        // Assert
        assertEquals(200, response.getStatusCode().value());
        Kullanici savedUser = (Kullanici) response.getBody();
        assertNotNull(savedUser);
        assertNotNull(savedUser.getId());
        assertEquals("USER", savedUser.getRol()); // Verification that registration defaults role to USER

        // Verify password hashing
        assertTrue(passwordEncoder.matches("mypassword123", savedUser.getSifre()));
        assertNotEquals("mypassword123", savedUser.getSifre());
    }

    @Test
    public void testUserLoginSuccess() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Login Test");
        user.setEmail("login@test.com");
        user.setSifre(passwordEncoder.encode("secretPass"));
        user.setRol("USER");
        userRepository.save(user);

        // Act - Correct login
        Kullanici loginRequest = new Kullanici();
        loginRequest.setEmail("login@test.com");
        loginRequest.setSifre("secretPass");

        ResponseEntity<?> successResponse = userController.loginUser(loginRequest);

        // Assert
        assertEquals(200, successResponse.getStatusCode().value());
        Kullanici loggedInUser = (Kullanici) successResponse.getBody();
        assertNotNull(loggedInUser);
        assertEquals("login@test.com", loggedInUser.getEmail());
    }

    @Test
    public void testUserLoginFailureWrongPassword() {
        // Arrange
        Kullanici user = new Kullanici();
        user.setAd_soyad("Login Fail Test");
        user.setEmail("loginfail@test.com");
        user.setSifre(passwordEncoder.encode("secretPass"));
        user.setRol("USER");
        userRepository.save(user);

        // Act - Wrong password
        Kullanici loginRequest = new Kullanici();
        loginRequest.setEmail("loginfail@test.com");
        loginRequest.setSifre("wrongPass");

        ResponseEntity<?> failResponse = userController.loginUser(loginRequest);

        // Assert
        assertEquals(401, failResponse.getStatusCode().value());
        assertEquals("Şifre hatalı.", failResponse.getBody());
    }
}
