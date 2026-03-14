package com.example.todo.service;

import com.example.todo.entity.RefreshToken;
import com.example.todo.entity.TokenType;
import com.example.todo.entity.User;
import com.example.todo.repository.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final TokenRepository tokenRepository;

    @Value("${jwt.refresh-expiration}")
    private long refreshExpirationMs;

    @Transactional
    public void saveUserRefreshToken(User user, String refreshToken) {
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .tokenType(TokenType.BEARER)
                .revoked(false)
                .expired(false)
                .createdAt(LocalDateTime.now())
                .expireAt(LocalDateTime.now().plusNanos(refreshExpirationMs * 1_000_000))
                .build();
        tokenRepository.save(token);
    }

    public boolean isTokenValid(String token) {
        return tokenRepository.findByToken(token)
                .map(stored -> !stored.isExpired() && !stored.isRevoked() && stored.getExpireAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return tokenRepository.findByToken(token);
    }

    @Transactional
    public void revokeToken(String token) {
        tokenRepository.findByToken(token).ifPresent(stored -> {
            stored.setExpired(true);
            stored.setRevoked(true);
            tokenRepository.save(stored);
        });
    }

    @Transactional
    public void revokeAllUserTokens(Long userId) {
        List<RefreshToken> validTokens = tokenRepository.findAllValidTokenByUser(userId);
        if (validTokens.isEmpty()) {
            return;
        }

        validTokens.forEach(token -> {
            token.setExpired(true);
            token.setRevoked(true);
        });
        tokenRepository.saveAll(validTokens);
    }
}

