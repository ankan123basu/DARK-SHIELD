package com.darkshield.model;

import com.darkshield.model.enums.IncidentSeverity;
import com.darkshield.model.enums.IncidentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Security Incident entity following NIST Incident Response lifecycle.
 * Tracks the full lifecycle from detection through resolution,
 * linking related threats and affected assets.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "incidents")
public class Incident {

    @Id
    private String id;

    private String title;

    private String description;

    private IncidentSeverity severity;

    @Builder.Default
    private IncidentStatus status = IncidentStatus.OPEN;

    /** User ID of assigned incident responder */
    private String assignedTo;

    /** Username of assigned responder (denormalized for display) */
    private String assignedToName;

    /** Linked threat IDs that triggered or relate to this incident */
    @Builder.Default
    private List<String> relatedThreats = new ArrayList<>();

    /** IDs of assets impacted by this incident */
    @Builder.Default
    private List<String> affectedAssets = new ArrayList<>();

    /** Timestamped event log entries tracking investigation progress */
    @Builder.Default
    private List<TimelineEntry> timeline = new ArrayList<>();

    private String resolutionNotes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    private LocalDateTime resolvedAt;

    /**
     * Inner class for incident timeline events.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEntry {
        private String action;
        private String performedBy;
        private String details;
        private LocalDateTime timestamp;
    }
}
