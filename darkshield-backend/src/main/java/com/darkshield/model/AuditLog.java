package com.darkshield.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Audit Log entity for tracking all system actions.
 * Provides a tamper-evident trail for compliance and forensics.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "audit_logs")
public class AuditLog {

    @Id
    private String id;

    private String userId;

    private String username;

    /** Action performed (e.g., "CREATE_THREAT", "ESCALATE_INCIDENT", "LOGIN") */
    private String action;

    /** Entity type affected (e.g., "Threat", "Incident", "Asset") */
    private String entity;

    /** ID of the affected entity */
    private String entityId;

    /** Additional details about the action */
    private String details;

    private String ipAddress;

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
