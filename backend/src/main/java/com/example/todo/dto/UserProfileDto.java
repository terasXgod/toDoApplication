package com.example.todo.dto;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserProfileDto {
    Long id;
    String username;
    String email;
    String telegram;
    String avatarUrl;
    String description;
}

