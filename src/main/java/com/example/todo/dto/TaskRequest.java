package com.example.todo.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;


@Data
public class TaskRequest {

    @NotBlank(message = "topic is required")
    @Size(min = 1, max = 100)
    private String topic;

    private String shortDescription;
    private String longDescription;

    @Min(1) @Max(10)
    private Integer importance;

    private LocalDateTime deadline;
}
