package com.example.todo.repository;

import com.example.todo.entity.WallMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WallMessageRepository extends JpaRepository<WallMessage, Long> {
    List<WallMessage> findByProfileOwnerIdOrderByCreatedAtDesc(Long profileOwnerId);
}

