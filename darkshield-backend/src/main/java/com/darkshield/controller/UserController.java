package com.darkshield.controller;

import com.darkshield.exception.ResourceNotFoundException;
import com.darkshield.model.User;
import com.darkshield.model.enums.Role;
import com.darkshield.repository.UserRepository;
import com.darkshield.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * User Management REST Controller (ADMIN only).
 * Allows administrators to list users and modify roles.
 */
@RestController
@RequestMapping("/api/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    /** GET /api/users — List all users (passwords excluded) */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        // Clear sensitive fields
        users.forEach(u -> {
            u.setPassword(null);
            u.setRefreshToken(null);
        });
        return ResponseEntity.ok(users);
    }

    /** GET /api/users/{id} — Get user by ID */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setPassword(null);
        user.setRefreshToken(null);
        return ResponseEntity.ok(user);
    }

    /** PUT /api/users/{id}/role — Update user role (ADMIN only) */
    @PutMapping("/{id}/role")
    public ResponseEntity<User> updateUserRole(@PathVariable String id,
                                                @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        String newRoleStr = body.get("role");
        Role oldRole = user.getRole();
        Role newRole = Role.valueOf(newRoleStr);

        user.setRole(newRole);
        User updated = userRepository.save(user);
        updated.setPassword(null);
        updated.setRefreshToken(null);

        auditLogService.log("UPDATE_USER_ROLE", "User", id,
                String.format("Role changed: %s → %s for user '%s'", oldRole, newRole, user.getUsername()));

        return ResponseEntity.ok(updated);
    }

    /** DELETE /api/users/{id} — Delete user (ADMIN only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        userRepository.delete(user);
        auditLogService.log("DELETE_USER", "User", id,
                "Deleted user: " + user.getUsername());
        return ResponseEntity.noContent().build();
    }
}
