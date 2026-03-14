package com.example.todo.service;

import com.example.todo.dto.JwtAuthentificationDto;
import com.example.todo.entity.User;
import com.example.todo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public JwtAuthentificationDto register(String username, String password, String email) {
        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setEmail(email);

        userRepository.save(user);
        return login(username, password);
    }

    @Transactional
    public JwtAuthentificationDto login(String username, String password) {
        Authentication authRequest = new UsernamePasswordAuthenticationToken(username, password);
        Authentication authResult;

        try {
            authResult = authenticationManager.authenticate(authRequest);
        } catch (BadCredentialsException e) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        UserDetails userDetails = (UserDetails) authResult.getPrincipal();
        JwtAuthentificationDto dto = jwtService.getJwtAuthentificationDto(userDetails);

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        refreshTokenService.revokeAllUserTokens(user.getId());
        refreshTokenService.saveUserRefreshToken(user, dto.getRefreshToken());
        return dto;
    }

    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.revokeToken(refreshToken);
    }

    @Transactional
    public void logoutAllForUser(String username) {
        userRepository.findByUsername(username).ifPresent(user -> refreshTokenService.revokeAllUserTokens(user.getId()));
    }

    @Transactional
    public JwtAuthentificationDto refreshToken(String refreshToken) {
        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!jwtService.isRefreshTokenValid(refreshToken, user)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }

        refreshTokenService.revokeToken(refreshToken);

        String newJwtToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);
        refreshTokenService.saveUserRefreshToken(user, newRefreshToken);

        return new JwtAuthentificationDto(newJwtToken, newRefreshToken);
    }
}
