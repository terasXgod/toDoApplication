package com.example.todo.dto;


import lombok.Data;

@Data
public class ProfileResponse {
    private Long id;
    private String username;
    private String description;
    private String tgId;
    private String avatarUrl;
}
