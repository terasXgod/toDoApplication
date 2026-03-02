package com.example.todo.controller;

import com.example.todo.dto.TaskRequest;
import com.example.todo.dto.TaskResponse;
import com.example.todo.entity.Task;
import com.example.todo.mapper.TaskMapper;
import com.example.todo.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "tasks", description = "method for tasks")
public class TaskController {

    private final TaskService taskService;
    private final TaskMapper taskMapper;


    // post request
    @Operation(summary = "create new task", description = "adding new task to db")
    @PostMapping
    public TaskResponse addTask(@Valid @RequestBody TaskRequest request,
                                Principal principal) {
        Task entity = taskMapper.toEntity(request);
        Task createdEntity = taskService.addTask(entity, principal.getName());
        return taskMapper.toResponse(createdEntity);
    }

    //get request
    @Operation(summary = "get all tasks (with pagenation)",
            description = "page (start with 0), size, sort")
    @GetMapping
    public Page<TaskResponse> getAllTasks(@PageableDefault(size = 5, sort = "createDate") Pageable pageable,
                                          Principal principal) {
        return taskService.getAllTasks(pageable, principal.getName()).map(taskMapper::toResponse);
    }

    @Operation(summary = "get task", description = "return task by id ")
    @GetMapping("/{id}")
    public TaskResponse getTaskById(@PathVariable Long id, Principal principal) {
        Task task = taskService.getTaskById(id, principal.getName());

        return taskMapper.toResponse(task);

    }

    //delete request
    @Operation(summary = "delete task", description = "delete task by id")
    @DeleteMapping("/{id}")
    public String deleteTask(@PathVariable Long id, Principal principal) {
        taskService.deleteTask(id, principal.getName());
        return "Task was deleted successfully!";
    }

    //put request
    @Operation(summary = "update task", description = "update task by id")
    @PutMapping("/{id}")
    public TaskResponse updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest updatedTask,
                                   Principal principal) {
        Task entity = taskMapper.toEntity(updatedTask);

        Task updatedEntity = taskService.updateTask(id, entity, principal.getName());

        return taskMapper.toResponse(updatedEntity);
    }

    //patch request
    @Operation(summary = "toggle task", description = "toggle task by id")
    @PatchMapping("/{id}/toggle")
    public void toggleTaskPatch(@PathVariable Long id, Principal principal) {
        taskService.toggleTask(id, principal.getName());
    }

}
