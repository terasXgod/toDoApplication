package com.example.todo.service;

import com.example.todo.dto.ProfileEditForm;
import com.example.todo.dto.UserProfileDto;
import com.example.todo.entity.User;
import com.example.todo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.Principal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDto getCurrentProfile(Principal principal) {
        User user = getUserFromPrincipal(principal);
        return toDto(user);
    }

    public UserProfileDto getProfileById(Long id) {
        return userRepository.findById(id)
                .map(this::toDto)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public boolean isCurrentUser(Long id, Principal principal) {
        if (principal == null) {
            return false;
        }
        Optional<User> opt = userRepository.findByUsername(principal.getName());
        return opt.map(user -> user.getId().equals(id)).orElse(false);
    }

    public ProfileEditForm getCurrentProfileForm(Principal principal) {
        User user = getUserFromPrincipal(principal);
        ProfileEditForm form = new ProfileEditForm();
        form.setDescription(user.getDescription());
        form.setTelegram(user.getTgId());
        return form;
    }

    public void updateCurrentProfile(Principal principal, ProfileEditForm form) {
        User user = getUserFromPrincipal(principal);

        user.setDescription(form.getDescription());
        user.setTgId(form.getTelegram());

        handlePasswordChange(user, form);
        handleAvatarUpload(user, form.getAvatar());

        userRepository.save(user);
    }

    private void handlePasswordChange(User user, ProfileEditForm form) {
        if (form.getNewPassword() == null || form.getNewPassword().isBlank()) {
            return;
        }
        if (form.getCurrentPassword() == null || form.getCurrentPassword().isBlank()) {
            throw new IllegalArgumentException("Current password is required");
        }
        if (!passwordEncoder.matches(form.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        if (!form.getNewPassword().equals(form.getConfirmPassword())) {
            throw new IllegalArgumentException("Password confirmation does not match");
        }
        user.setPassword(passwordEncoder.encode(form.getNewPassword()));
    }

    private void handleAvatarUpload(User user, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            return;
        }
        try {
            Path uploadDir = Paths.get("uploads", "avatars");
            Files.createDirectories(uploadDir);

            String originalName = Optional.ofNullable(avatar.getOriginalFilename()).orElse("avatar");
            String ext = originalName.contains(".") ? originalName.substring(originalName.lastIndexOf('.')) : "";
            String fileName = user.getId() + "-" + System.currentTimeMillis() + ext;
            Path target = uploadDir.resolve(fileName);

            Files.write(target, avatar.getBytes());
            user.setAvatarUrl("/uploads/avatars/" + fileName);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to save avatar", e);
        }
    }

    private UserProfileDto toDto(User user) {
        return UserProfileDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .telegram(user.getTgId())
                .avatarUrl(user.getAvatarUrl())
                .description(user.getDescription())
                .build();
    }

    private User getUserFromPrincipal(Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }
}
