package com.example.todo.repository;

import com.example.todo.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface TokenRepository extends JpaRepository<RefreshToken, Long> {
    @Query("""
      select t from RefreshToken t
      where t.user.id = :userId and t.expired = false and t.revoked = false
      """)
    List<RefreshToken> findAllValidTokenByUser(Long userId);

    Optional<RefreshToken> findByToken(String token);
}
