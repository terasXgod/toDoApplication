package com.example.todo.controller;

import com.example.todo.dto.JwtAuthentificationDto;
import com.example.todo.dto.UserRequest;
import com.example.todo.service.AuthService;
import com.example.todo.service.JwtService;
import io.jsonwebtoken.JwtException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentification", description = "sign up and sign in")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @Operation(summary = "sign up", description = "register new user")
    @PostMapping("/register")
    public ResponseEntity<?> registerNewUser(@Valid @RequestBody UserRequest request) {
        log.info("Registration attempt for user: {}", request.getUsername());

        try {
            JwtAuthentificationDto dto = authService.register(request.getUsername(), request.getPassword(), request.getEmail());
            log.info("User registered successfully: {}", request.getUsername());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            log.warn("Registration failed for user: {}", request.getUsername());
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @Operation(summary = "login", description = "if user is authenticated")
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody UserRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        try {
            JwtAuthentificationDto dto = authService.login(request.getUsername(), request.getPassword());
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException e) {
            log.warn("Login failed for user: {}", request.getUsername());
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    @Operation(summary = "refresh token", description = "get new access token by refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Token refresh attempt");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Invalid refresh token");
        }

        String refreshToken = authHeader.substring("Bearer ".length());
        try {
            JwtAuthentificationDto dto = authService.refreshToken(refreshToken);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException | JwtException e) {
            return ResponseEntity.status(401).body("Invalid refresh token");
        }
    }

    @Operation(summary = "logout", description = "logout and forget refresh token")
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Logout attempt");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring("Bearer ".length());
            // Если передали refresh — отзываем его
            try {
                authService.logout(token);
                return ResponseEntity.ok().body("Logged out successfully");
            } catch (IllegalArgumentException e) {
                // Если это не refresh или не найден – попробуем как access
                authService.logoutAllForUser(jwtService.extractUsername(token));
                return ResponseEntity.ok().body("Logged out (all sessions) successfully");
            }
        }

        // Если refresh не передан, но пользователь аутентифицирован access токеном
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            authService.logoutAllForUser(authentication.getName());
            return ResponseEntity.ok().body("Logged out (all sessions) successfully");
        }

        return ResponseEntity.badRequest().body("Invalid logout request: no token provided");
    }
}
