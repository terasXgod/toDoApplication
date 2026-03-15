package com.example.todo.service;

import com.example.todo.dto.WallMessageRequest;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.Collections;
import java.util.List;

@Service
public class WallMesageService {

    public List<Object> getMessagesForCurrentUser(Principal principal) {
        // TODO: implement fetching wall messages for current user
        return Collections.emptyList();
    }

    public List<Object> getMessagesByProfileId(Long profileId) {
        // TODO: implement fetching wall messages by profile id
        return Collections.emptyList();
    }

    public void addMessage(Long profileId, Principal principal, WallMessageRequest request) {
        // TODO: implement adding message to user's wall
    }
}
