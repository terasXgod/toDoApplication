package com.example.todo.controller;

import ch.qos.logback.core.model.Model;
import com.example.todo.dto.TaskResponse;
import com.example.todo.service.ProfileService;
import com.example.todo.service.TaskService;
import com.example.todo.service.WallMesageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;

@RestController
@RequestMapping("/profile")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "profile", description = "show and edit info about user")
public class ProfileController {

    private final ProfileService profileService;
    private final WallMesageService wallMesageService;

    @Operation(summary = "show current user profile", description = "show and edit info about user," +
            " show all instruments to edit info")
    @GetMapping
    public ResponseEntity<?> getProfile(Principal principal) {
        var profile = profileService.getProfile(principal.getName());
        return ResponseEntity.ok(profile);
    }


}
