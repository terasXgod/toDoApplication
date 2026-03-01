package com.example.todo.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskResponse {

    private Long id;
    private String topic;
    private String shortDescription;
    private boolean isComplete;
    private int importance;
    private LocalDateTime createDate;
    private LocalDateTime endDate;

}
