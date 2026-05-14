package com.darkshield.config;

import com.darkshield.security.CustomUserDetailsService;
import com.darkshield.security.JwtAuthEntryPoint;
import com.darkshield.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Spring Security configuration with JWT-based stateless authentication.
 * Configures:
 * - Stateless session management (no cookies/sessions)
 * - JWT filter chain integration
 * - Public vs protected endpoint access rules
 * - Role-based method-level security via @PreAuthorize
 * - BCrypt password encoding
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private JwtAuthEntryPoint authEntryPoint;

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF for stateless JWT auth
                .csrf(csrf -> csrf.disable())

                // Enable CORS
                .cors(cors -> cors.configure(http))

                // Custom 401 handler
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(authEntryPoint)
                )

                // Stateless session — no session cookies
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Endpoint access rules
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // WebSocket handshake — must be public for SockJS
                        .requestMatchers("/ws-chat/**").permitAll()

                        // Admin-only endpoints
                        .requestMatchers("/api/users/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/assets/**").hasAuthority("ROLE_ADMIN")

                        // Hunter+ endpoints (full incident lifecycle)
                        .requestMatchers("/api/incidents/*/escalate").hasAnyAuthority("ROLE_HUNTER", "ROLE_ADMIN")
                        .requestMatchers("/api/incidents/*/contain").hasAnyAuthority("ROLE_HUNTER", "ROLE_ADMIN")
                        .requestMatchers("/api/incidents/*/eradicate").hasAnyAuthority("ROLE_HUNTER", "ROLE_ADMIN")
                        .requestMatchers("/api/incidents/*/recover").hasAnyAuthority("ROLE_HUNTER", "ROLE_ADMIN")
                        .requestMatchers("/api/incidents/*/resolve").hasAnyAuthority("ROLE_HUNTER", "ROLE_ADMIN")

                        // All other authenticated endpoints
                        .anyRequest().authenticated()
                )

                // Set custom auth provider
                .authenticationProvider(authenticationProvider())

                // Add JWT filter before Spring's default auth filter
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
