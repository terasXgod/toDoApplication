package com.example.todo.service;

import com.example.todo.entity.Task;
import com.example.todo.entity.User;
import com.example.todo.exception.ResourceNotFoundException;
import com.example.todo.repository.TaskRepository;
import com.example.todo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public Task addTask(Task task, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        task.setUser(user);
        return taskRepository.save(task);
    }

    public Page<Task> getAllTasks(Pageable pageable, String username) {
        return taskRepository.findByUserUsername(username, pageable);
    }

    public Task getTaskById(Long id, String username) {
        return taskRepository.findByIdAndUserUsername(id, username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Задача с id " + id + " не найдена или у вас нет к ней доступа"
                ));
    }

    public Task updateTask(Long id, Task updatedTask, String username) {
        Task task = getTaskById(id, username);

        if (updatedTask.getTopic() != null) task.setTopic(updatedTask.getTopic());
        if (updatedTask.getShortDescription() != null) task.setShortDescription(updatedTask.getShortDescription());
        if (updatedTask.getImportance() != null) task.setImportance(updatedTask.getImportance());
        if (updatedTask.getImportance() != null) task.setImportance(updatedTask.getImportance());
        if (updatedTask.getLink() != null) task.setLink(updatedTask.getLink());
        if (updatedTask.getLongDescription() != null) task.setLongDescription(updatedTask.getLongDescription());
        if (updatedTask.getPicture() != null) task.setPicture(updatedTask.getPicture());
        if (updatedTask.getDeadline() != null) task.setDeadline(updatedTask.getDeadline());

        return taskRepository.save(task);
    }

    public void deleteTask(Long id, String username) {
        taskRepository.deleteById(id);
    }

    public void toggleTask(Long id, String username) {
        Task task = getTaskById(id, username);
        task.setComplete(!task.isComplete());
        taskRepository.save(task);
    }


}
