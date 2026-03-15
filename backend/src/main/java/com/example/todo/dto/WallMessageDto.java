package com.example.todo.dto;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class WallMessageDto {
    Long id;
    Long authorId;
    String authorName;
    String text;
    LocalDateTime createdAt;
}

