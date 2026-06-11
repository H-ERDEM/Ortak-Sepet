/**
 * GuvenlikYapilandirmasi: Spring Security güvenlik yapılandırmalarını içerir.
 * Uygulamadaki REST uç noktalarının yetkilendirme kurallarını, OAuth2 Google Giriş (Login) başarımı,
 * CORS ayarları ve BCrypt şifreleme mekanizmalarını yönetir.
 */
package com.example.OrtakSepet1.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientManager;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProvider;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientProviderBuilder;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.AuthorizedClientServiceOAuth2AuthorizedClientManager;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.example.OrtakSepet1.service.GmailCanliTakipServisi;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class GuvenlikYapilandirmasi {

    private final OAuth2AuthorizedClientService authorizedClientService;
    private final GmailCanliTakipServisi gmailLiveTrackingService;
    private final ClientRegistrationRepository clientRegistrationRepository;

    public GuvenlikYapilandirmasi(OAuth2AuthorizedClientService authorizedClientService, 
                          GmailCanliTakipServisi gmailLiveTrackingService,
                          ClientRegistrationRepository clientRegistrationRepository) {
        this.authorizedClientService = authorizedClientService;
        this.gmailLiveTrackingService = gmailLiveTrackingService;
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager() {
        OAuth2AuthorizedClientProvider authorizedClientProvider =
                OAuth2AuthorizedClientProviderBuilder.builder()
                        .authorizationCode()
                        .refreshToken()
                        .build();

        AuthorizedClientServiceOAuth2AuthorizedClientManager authorizedClientManager =
                new AuthorizedClientServiceOAuth2AuthorizedClientManager(
                        clientRegistrationRepository, authorizedClientService);
        authorizedClientManager.setAuthorizedClientProvider(authorizedClientProvider);

        return authorizedClientManager;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable()) // Disable CSRF for REST APIs
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/users/**", 
                    "/api/products/**", 
                    "/api/groups/**", 
                    "/api/stocks/**", 
                    "/api/cargos/**",
                    "/api/alarms/**",
                    "/api/notifications/**",
                    "/api/support/**",
                    "/login/**",
                    "/oauth2/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .successHandler(oauth2SuccessHandler())
            );

        return http.build();
    }

    @Bean
    public AuthenticationSuccessHandler oauth2SuccessHandler() {
        return (request, response, authentication) -> {
            if (authentication instanceof OAuth2AuthenticationToken) {
                OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
                String clientRegistrationId = oauthToken.getAuthorizedClientRegistrationId();
                String principalName = oauthToken.getName();
                
                OAuth2AuthorizedClient client = authorizedClientService.loadAuthorizedClient(
                    clientRegistrationId, principalName
                );
                
                if (client != null && client.getAccessToken() != null) {
                    String tokenValue = client.getAccessToken().getTokenValue();
                    
                    Long userId = null;
                    Object userIdObj = request.getSession().getAttribute("oauthUserId");
                    if (userIdObj instanceof Long) {
                        userId = (Long) userIdObj;
                    } else if (userIdObj instanceof String) {
                        try {
                            userId = Long.parseLong((String) userIdObj);
                        } catch (NumberFormatException ignored) {}
                    }
                    
                    if (userId != null) {
                        gmailLiveTrackingService.saveUserOAuth2Details(userId, clientRegistrationId, principalName, tokenValue);
                    } else {
                        gmailLiveTrackingService.setOAuth2Details(clientRegistrationId, principalName, tokenValue);
                    }
                    System.out.println("[OAUTH2] Google Access Token başarıyla alındı ve set edildi.");
                }
            }
            Object savedRedirect = request.getSession().getAttribute("oauthRedirectUrl");
            String targetUrl = savedRedirect instanceof String ? (String) savedRedirect : "http://localhost:3000/cargo?success=true";
            request.getSession().removeAttribute("oauthRedirectUrl");
            
            String referer = request.getHeader("Referer");
            if (savedRedirect == null && referer != null && (referer.contains("localhost:3001") || referer.contains("3001"))) {
                targetUrl = "http://localhost:3001/cargo?success=true";
            }
            response.sendRedirect(targetUrl);
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "http://localhost:3001")); // Allow React frontend on both ports
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
