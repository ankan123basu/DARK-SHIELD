package com.darkshield.controller;

import com.darkshield.dto.IncidentRequest;
import com.darkshield.model.Incident;
import com.darkshield.model.enums.IncidentStatus;
import com.darkshield.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Incident Response REST Controller.
 * Manages the full incident lifecycle: create → investigate → contain → resolve.
 * Includes escalation and resolution workflows with role-based access.
 */
@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    /** GET /api/incidents — List all incidents */
    @GetMapping
    public ResponseEntity<List<Incident>> getAllIncidents() {
        return ResponseEntity.ok(incidentService.getAllIncidents());
    }

    /** GET /api/incidents/{id} — Get incident by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    /** POST /api/incidents — Create new incident */
    @PostMapping
    public ResponseEntity<Incident> createIncident(@Valid @RequestBody IncidentRequest request) {
        Incident created = incidentService.createIncident(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /** PUT /api/incidents/{id} — Update incident */
    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(@PathVariable String id,
                                                    @RequestBody IncidentRequest request) {
        return ResponseEntity.ok(incidentService.updateIncident(id, request));
    }

    /** PUT /api/incidents/{id}/escalate — Escalate severity → INVESTIGATING */
    @PutMapping("/{id}/escalate")
    @PreAuthorize("hasAnyAuthority('ROLE_HUNTER', 'ROLE_ADMIN')")
    public ResponseEntity<Incident> escalateIncident(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.escalateIncident(id));
    }

    /** PUT /api/incidents/{id}/contain — Move to CONTAINMENT phase */
    @PutMapping("/{id}/contain")
    @PreAuthorize("hasAnyAuthority('ROLE_HUNTER', 'ROLE_ADMIN')")
    public ResponseEntity<Incident> containIncident(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.containIncident(id));
    }

    /** PUT /api/incidents/{id}/eradicate — Move to ERADICATION phase */
    @PutMapping("/{id}/eradicate")
    @PreAuthorize("hasAnyAuthority('ROLE_HUNTER', 'ROLE_ADMIN')")
    public ResponseEntity<Incident> eradicateIncident(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.eradicateIncident(id));
    }

    /** PUT /api/incidents/{id}/recover — Move to RECOVERY phase */
    @PutMapping("/{id}/recover")
    @PreAuthorize("hasAnyAuthority('ROLE_HUNTER', 'ROLE_ADMIN')")
    public ResponseEntity<Incident> recoverIncident(@PathVariable String id) {
        return ResponseEntity.ok(incidentService.recoverIncident(id));
    }

    /** PUT /api/incidents/{id}/resolve — Resolve and close incident (HUNTER+ only) */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyAuthority('ROLE_HUNTER', 'ROLE_ADMIN')")
    public ResponseEntity<Incident> resolveIncident(@PathVariable String id,
                                                     @RequestBody Map<String, String> body) {
        String notes = body.getOrDefault("resolutionNotes", "Resolved");
        return ResponseEntity.ok(incidentService.resolveIncident(id, notes));
    }

    /** GET /api/incidents/open — Get all non-closed incidents */
    @GetMapping("/open")
    public ResponseEntity<List<Incident>> getOpenIncidents() {
        return ResponseEntity.ok(incidentService.getOpenIncidents());
    }

    /** GET /api/incidents/status/{status} — Filter by status */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Incident>> getIncidentsByStatus(@PathVariable String status) {
        IncidentStatus incidentStatus = IncidentStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(incidentService.getIncidentsByStatus(incidentStatus));
    }

    /** GET /api/incidents/recent — Get 10 most recent incidents */
    @GetMapping("/recent")
    public ResponseEntity<List<Incident>> getRecentIncidents() {
        return ResponseEntity.ok(incidentService.getRecentIncidents());
    }

    /** DELETE /api/incidents/{id} — Delete incident */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteIncident(@PathVariable String id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }
}
