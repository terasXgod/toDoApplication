package com.example.todo.service;

import com.example.todo.entity.Task;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository repository;

    public Task addTask(Task task) {
        return repository.save(task);
    }

    public Page<Task> getAllTasks(Pageable pageable) {
        return repository.findAll(pageable);
    }

    public Task getTaskById(Long id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Task not found with id: " + id));
    }

    public Task updateTask(Long id, Task updatedTask) {
        Task task = getTaskById(id);

        if (updatedTask.getTopic() != null) task.setTopic(updatedTask.getTopic());
        if (updatedTask.getShortDescription() != null) task.setShortDescription(updatedTask.getShortDescription());
        if (updatedTask.getImportance() != null) task.setImportance(updatedTask.getImportance());
        if (updatedTask.getImportance() != null) task.setImportance(updatedTask.getImportance());
        if (updatedTask.getLink() != null) task.setLink(updatedTask.getLink());
        if (updatedTask.getLongDescription() != null) task.setLongDescription(updatedTask.getLongDescription());
        if (updatedTask.getPicture() != null) task.setPicture(updatedTask.getPicture());
        if (updatedTask.getDeadline() != null) task.setDeadline(updatedTask.getDeadline());

        return repository.save(task);
    }

    public void deleteTask(Long id) {
        repository.deleteById(id);
    }

    public void toggleTask(Long id) {
        Task task = getTaskById(id);
        task.setComplete(!task.isComplete());
        repository.save(task);
    }


}
