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
@Table(name = "tasks")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Task need topic")
    @Size(min = 3, max = 100, message = "topic length must be from 3 to 100 symbols")
    private String topic;

    @Size(max = 255, message = "short description is too long")
    private String shortDescription;

    private String longDescription;
    private String trueDescription;
    private String link;
    private String picture;
    private boolean isComplete = false;

    @Min(value = 1, message = "importance must be more than 1")
    @Max(value = 10, message = "importance must be less than 10")
    private Integer importance;

    private LocalDateTime createDate;
    private LocalDateTime updateDate;
    private LocalDateTime endDate;
    private LocalDateTime deadline;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;


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
