package com.example.todo.dto;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class ProfileEditForm {
    private String description;
    private String telegram;
    private String currentPassword;
    private String newPassword;
    private String confirmPassword;
    private MultipartFile avatar;
}

