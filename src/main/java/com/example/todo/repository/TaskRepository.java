package com.example.todo.repository;

import com.example.todo.entity.Task;
import com.example.todo.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    Page<Task> findByUserId(Long userId, Pageable pageable);
    Page<Task> findByUserUsername(String username, Pageable pageable);

    @Query("SELECT t FROM Task t WHERE t.id = :id AND t.user.username = :username")
    Optional<Task> findByIdAndUserUsername(Long id, String username);
}
