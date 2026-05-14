package com.darkshield.service;

import com.darkshield.dto.IncidentRequest;
import com.darkshield.exception.ResourceNotFoundException;
import com.darkshield.model.Incident;
import com.darkshield.model.enums.IncidentSeverity;
import com.darkshield.model.enums.IncidentStatus;
import com.darkshield.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for managing security incidents through the NIST response lifecycle.
 * Supports full CRUD, status transitions, escalation, and resolution workflows.
 */
@Service
public class IncidentService {

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Incident createIncident(IncidentRequest request) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .severity(request.getSeverity())
                .status(IncidentStatus.OPEN)
                .assignedTo(request.getAssignedTo())
                .relatedThreats(request.getRelatedThreats() != null ? request.getRelatedThreats() : new ArrayList<>())
                .affectedAssets(request.getAffectedAssets() != null ? request.getAffectedAssets() : new ArrayList<>())
                .timeline(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        // Add creation timeline entry
        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("INCIDENT_CREATED")
                .performedBy(currentUser)
                .details("Incident created with severity: " + request.getSeverity())
                .timestamp(LocalDateTime.now())
                .build());

        Incident saved = incidentRepository.save(incident);

        auditLogService.log("CREATE_INCIDENT", "Incident", saved.getId(),
                "Created incident: " + saved.getTitle());

        return saved;
    }

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    public Incident getIncidentById(String id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    public List<Incident> getOpenIncidents() {
        return incidentRepository.findByStatusNot(IncidentStatus.CLOSED);
    }

    public List<Incident> getIncidentsByStatus(IncidentStatus status) {
        return incidentRepository.findByStatus(status);
    }

    public List<Incident> getIncidentsBySeverity(IncidentSeverity severity) {
        return incidentRepository.findBySeverity(severity);
    }

    public List<Incident> getIncidentsByAssignee(String userId) {
        return incidentRepository.findByAssignedTo(userId);
    }

    public List<Incident> getRecentIncidents() {
        return incidentRepository.findTop10ByOrderByCreatedAtDesc();
    }

    /**
     * Update incident details and add a timeline entry.
     */
    public Incident updateIncident(String id, IncidentRequest request) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        StringBuilder changes = new StringBuilder();

        if (request.getTitle() != null) {
            incident.setTitle(request.getTitle());
            changes.append("Title updated. ");
        }
        if (request.getDescription() != null) {
            incident.setDescription(request.getDescription());
            changes.append("Description updated. ");
        }
        if (request.getSeverity() != null) {
            changes.append(String.format("Severity: %s → %s. ", incident.getSeverity(), request.getSeverity()));
            incident.setSeverity(request.getSeverity());
        }
        if (request.getStatus() != null && request.getStatus() != incident.getStatus()) {
            changes.append(String.format("Status: %s → %s. ", incident.getStatus(), request.getStatus()));
            incident.setStatus(request.getStatus());
            if (request.getStatus() == IncidentStatus.CLOSED) {
                incident.setResolvedAt(LocalDateTime.now());
            }
        }
        if (request.getAssignedTo() != null) {
            incident.setAssignedTo(request.getAssignedTo());
            changes.append("Reassigned. ");
        }
        if (request.getRelatedThreats() != null) {
            incident.setRelatedThreats(request.getRelatedThreats());
        }
        if (request.getAffectedAssets() != null) {
            incident.setAffectedAssets(request.getAffectedAssets());
        }
        if (request.getResolutionNotes() != null) {
            incident.setResolutionNotes(request.getResolutionNotes());
        }

        // Add timeline entry for the update
        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("INCIDENT_UPDATED")
                .performedBy(currentUser)
                .details(changes.toString().trim())
                .timestamp(LocalDateTime.now())
                .build());

        Incident updated = incidentRepository.save(incident);

        auditLogService.log("UPDATE_INCIDENT", "Incident", id, changes.toString().trim());

        return updated;
    }

    /**
     * Escalate an incident (increase severity and add timeline entry).
     */
    public Incident escalateIncident(String id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        IncidentSeverity oldSeverity = incident.getSeverity();
        IncidentSeverity newSeverity = switch (oldSeverity) {
            case P4 -> IncidentSeverity.P3;
            case P3 -> IncidentSeverity.P2;
            case P2 -> IncidentSeverity.P1;
            case P1 -> IncidentSeverity.P1;
        };

        incident.setSeverity(newSeverity);
        incident.setStatus(IncidentStatus.INVESTIGATING);

        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("INCIDENT_ESCALATED")
                .performedBy(currentUser)
                .details(String.format("Severity escalated: %s → %s", oldSeverity, newSeverity))
                .timestamp(LocalDateTime.now())
                .build());

        Incident escalated = incidentRepository.save(incident);
        auditLogService.log("ESCALATE_INCIDENT", "Incident", id,
                String.format("Escalated from %s to %s", oldSeverity, newSeverity));
        return escalated;
    }

    /**
     * Move incident to CONTAINMENT phase.
     */
    public Incident containIncident(String id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        incident.setStatus(IncidentStatus.CONTAINMENT);

        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("CONTAINMENT_STARTED")
                .performedBy(currentUser)
                .details("Threat contained — isolating affected systems")
                .timestamp(LocalDateTime.now())
                .build());

        Incident saved = incidentRepository.save(incident);
        auditLogService.log("CONTAIN_INCIDENT", "Incident", id, "Containment phase started");
        return saved;
    }

    /**
     * Move incident to ERADICATION phase.
     */
    public Incident eradicateIncident(String id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        incident.setStatus(IncidentStatus.ERADICATION);

        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("ERADICATION_STARTED")
                .performedBy(currentUser)
                .details("Eradication in progress — removing threat artifacts")
                .timestamp(LocalDateTime.now())
                .build());

        Incident saved = incidentRepository.save(incident);
        auditLogService.log("ERADICATE_INCIDENT", "Incident", id, "Eradication phase started");
        return saved;
    }

    /**
     * Move incident to RECOVERY phase.
     */
    public Incident recoverIncident(String id) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        incident.setStatus(IncidentStatus.RECOVERY);

        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("RECOVERY_STARTED")
                .performedBy(currentUser)
                .details("Recovery phase — restoring systems to normal operations")
                .timestamp(LocalDateTime.now())
                .build());

        Incident saved = incidentRepository.save(incident);
        auditLogService.log("RECOVER_INCIDENT", "Incident", id, "Recovery phase started");
        return saved;
    }

    /**
     * Resolve and close an incident with resolution notes.
     */
    public Incident resolveIncident(String id, String resolutionNotes) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();
        Incident incident = getIncidentById(id);

        incident.setStatus(IncidentStatus.CLOSED);
        incident.setResolutionNotes(resolutionNotes);
        incident.setResolvedAt(LocalDateTime.now());

        incident.getTimeline().add(Incident.TimelineEntry.builder()
                .action("INCIDENT_RESOLVED")
                .performedBy(currentUser)
                .details("Incident resolved. Notes: " + resolutionNotes)
                .timestamp(LocalDateTime.now())
                .build());

        Incident resolved = incidentRepository.save(incident);

        auditLogService.log("RESOLVE_INCIDENT", "Incident", id,
                "Incident resolved by " + currentUser);

        return resolved;
    }

    public void deleteIncident(String id) {
        Incident incident = getIncidentById(id);
        incidentRepository.delete(incident);
        auditLogService.log("DELETE_INCIDENT", "Incident", id,
                "Deleted incident: " + incident.getTitle());
    }
}
