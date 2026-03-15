package com.example.todo.mapper;

import com.example.todo.dto.ProfileResponse;
import com.example.todo.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public ProfileResponse toProfileRequest(User user) {
        ProfileResponse response = new ProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setDescription(user.getDescription());
        response.setTgId(user.getTgId());
        response.setAvatarUrl(user.getAvatarUrl());
        return response;
    }
}
