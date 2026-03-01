package com.example.todo.controller;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.entity.Task;
import com.example.todo.mapper.TaskMapper;
import com.example.todo.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final TaskMapper taskMapper;


    // post request
    @PostMapping
    public TaskResponse addTask(@Valid @RequestBody TaskRequest request) {
        Task entity = taskMapper.toEntity(request);
        Task createdEntity = taskService.addTask(entity);
        return taskMapper.toResponse(createdEntity);
    }

    //get request
    @GetMapping
    public List<TaskResponse> getAllTasks() {
        return taskService.getAllTasks().stream()
                .map(taskMapper::toResponse)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public TaskResponse getTaskById(@PathVariable Long id) {
        Task task = taskService.getTaskById(id);

        return taskMapper.toResponse(task);

    }

    //delete request
    @DeleteMapping("/{id}")
    public String deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return "Task was deleted successfully!";
    }

    //put request
    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest updatedTask) {
        Task entity = taskMapper.toEntity(updatedTask);

        Task updatedEntity = taskService.updateTask(id, entity);

        return taskMapper.toResponse(updatedEntity);
    }

    //patch request
    @PatchMapping("/{id}/toggle")
    public void toggleTaskPatch(@PathVariable Long id) {
        taskService.toggleTask(id);
    }

}
