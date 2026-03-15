package com.example.todo.config;

import com.example.todo.security.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.Customizer;
import org.springframework.http.HttpMethod;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService userDetailsService;
    // 1. Инжектируем наш JWT фильтр
    private final JwtAuthenticationFilter jwtAuthenticationFilter;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Включаем поддержку CORS
                .cors(Customizer.withDefaults())

                // Отключаем CSRF (для REST API — JWT не уязвим к CSRF)
                .csrf(AbstractHttpConfigurer::disable)

                // Настраиваем правила доступа к endpoint-ам
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/auth/register", "/auth/login", "/auth/refresh", "/auth/logout").permitAll() // публичные
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll() // Swagger
                        .anyRequest().authenticated() // всё остальное — только с валидным JWT
                )

                // STATELESS: Spring не создаёт HTTP-сессии, каждый запрос аутентифицируется через JWT
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .userDetailsService(userDetailsService)

                // 2. Регистрируем JWT фильтр ПЕРЕД стандартным фильтром логина/пароля
                // Порядок важен: сначала проверяем токен, потом всё остальное
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}