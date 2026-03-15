package com.example.todo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WallMessageRequest {

    @NotBlank
    @Size(max = 500)
    private String text;
}

