package com.web.backend_SupplyLens.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import com.web.backend_SupplyLens.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private UserRepository userRepository;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtFilter jwtFilter(JwtService jwtService) {
        return new JwtFilter(jwtService, userRepository);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // --- UPDATED: ALLOWED ORIGINS ---
        // Added Vercel URL, Python Service URL, and kept localhost for your local testing
        configuration.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173", 
            "https://supply-lens-six.vercel.app", 
            "https://supplylens-1.onrender.com"
        ));
        
        // Allow all standard methods
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        
        // --- UPDATED: ALLOWED HEADERS ---
        // Using "*" is safer for production builds to avoid "Header not allowed" errors
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // --- UPDATED: ALLOW CREDENTIALS ---
        // Set to TRUE so that JWT/Cookies can be sent between Frontend and Backend
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
        // Apply the CORS configuration source defined above
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(
                                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                        .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                })
        )
                .authorizeHttpRequests(auth -> auth
                        // Permitting OPTIONS requests is critical for CORS "preflight" checks
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/auth/**").permitAll()
                        .requestMatchers("/api/alerts/**").permitAll()
                        .requestMatchers("/api/route/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/warehouse/all").permitAll()   
                        .requestMatchers(HttpMethod.POST, "/api/warehouse/create").permitAll() 
                        .requestMatchers("/ws/**").permitAll()
                        
                        // Roles-based access
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .requestMatchers("/api/driver/**").hasAnyRole("DRIVER", "ADMIN")
                        .requestMatchers("/api/shipments/**").hasRole("ADMIN")
                        .requestMatchers("/api/transport/**").hasRole("ADMIN")
                        .requestMatchers("/api/warehouse/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}