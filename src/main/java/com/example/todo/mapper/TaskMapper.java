package com.example.todo.mapper;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.entity.Task;
import org.springframework.stereotype.Component;

@Component
public class TaskMapper {

    public TaskResponse toResponse(Task task) {
        TaskResponse response = new TaskResponse();
        response.setId(task.getId());
        response.setTopic(task.getTopic());
        response.setShortDescription(task.getShortDescription());
        response.setComplete(task.isComplete());
        response.setImportance(task.getImportance());
        response.setEndDate(task.getEndDate());
        response.setCreateDate(task.getCreateDate());
        return response;
    }

    public Task toEntity(TaskRequest request) {
        Task task = new Task();
        task.setTopic(request.getTopic());
        task.setShortDescription(request.getShortDescription());
        task.setImportance(request.getImportance());
        task.setLongDescription(request.getLongDescription());
        return task;
    }

}
