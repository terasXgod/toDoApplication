package com.example.todo.entity;

import jakarta.persistence.*;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "У задачи должна быть тема")
    @Size(min = 3, max = 100, message = "Тема должна быть от 3 до 100 символов")
    private String topic;

    @Size(max = 255, message = "Краткое описание слишком длинное")
    private String shortDescription;

    private String longDescription;
    private String trueDescription;
    private String link;
    private String picture;
    private boolean isComplete = false;

    @Min(value = 1, message = "Важность не может быть меньше 1")
    @Max(value = 10, message = "Важность не может быть больше 10")
    private Integer importance;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;
    private LocalDateTime endDate;


    @PrePersist
    public void setCreateDate() {
        this.createDate = LocalDateTime.now();
    }

    @PreUpdate
    public void setUpdateDate() {
        this.updateDate = LocalDateTime.now();
    }


    public void setComplete(boolean complete) {
        if (complete) {
            setEndDate(LocalDateTime.now());
        } else {
            setEndDate(null);
        }
        setUpdateDate();
        isComplete = complete;

    }
}
