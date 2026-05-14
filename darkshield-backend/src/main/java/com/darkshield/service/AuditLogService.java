package com.darkshield.service;

import com.darkshield.model.AuditLog;
import com.darkshield.repository.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for creating and querying audit trail entries.
 * Every mutation in the system is logged for compliance and forensics.
 */
@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    /**
     * Log an action performed by the currently authenticated user.
     */
    public void log(String action, String entity, String entityId, String details) {
        String username = "SYSTEM";
        String userId = "SYSTEM";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            username = auth.getName();
            userId = auth.getName(); // Using username as userId for simplicity
        }

        AuditLog log = AuditLog.builder()
                .userId(userId)
                .username(username)
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }

    /**
     * Log a system-generated action (e.g., auto-escalation).
     */
    public void logSystem(String action, String entity, String entityId, String details) {
        AuditLog log = AuditLog.builder()
                .userId("SYSTEM")
                .username("SYSTEM")
                .action(action)
                .entity(entity)
                .entityId(entityId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        auditLogRepository.save(log);
    }

    public List<AuditLog> getRecentLogs() {
        return auditLogRepository.findTop50ByOrderByTimestampDesc();
    }

    public List<AuditLog> getLogsByUser(String userId) {
        return auditLogRepository.findByUserId(userId);
    }

    public List<AuditLog> getLogsByEntity(String entity) {
        return auditLogRepository.findByEntity(entity);
    }
}
