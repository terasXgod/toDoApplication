package com.example.todo.dto;

import lombok.Data;

@Data
public class JwtAuthentificationDto {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";

    public JwtAuthentificationDto(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

}
