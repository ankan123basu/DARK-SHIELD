package com.darkshield.controller;

import com.darkshield.dto.ThreatRequest;
import com.darkshield.model.Threat;
import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatStatus;
import com.darkshield.model.enums.ThreatType;
import com.darkshield.service.ThreatService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Threat Intelligence REST Controller.
 * Full CRUD with filtering by severity, status, and type.
 * Auto-calculates threat scores on create/update.
 */
@RestController
@RequestMapping("/api/threats")
public class ThreatController {

    @Autowired
    private ThreatService threatService;

    /** GET /api/threats — List all threats */
    @GetMapping
    public ResponseEntity<List<Threat>> getAllThreats() {
        return ResponseEntity.ok(threatService.getAllThreats());
    }

    /** GET /api/threats/{id} — Get threat by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Threat> getThreatById(@PathVariable String id) {
        return ResponseEntity.ok(threatService.getThreatById(id));
    }

    /** POST /api/threats — Create new threat (auto-scored) */
    @PostMapping
    public ResponseEntity<Threat> createThreat(@Valid @RequestBody ThreatRequest request) {
        Threat created = threatService.createThreat(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /** PUT /api/threats/{id} — Update threat (score recalculated) */
    @PutMapping("/{id}")
    public ResponseEntity<Threat> updateThreat(@PathVariable String id,
                                                @RequestBody ThreatRequest request) {
        return ResponseEntity.ok(threatService.updateThreat(id, request));
    }

    /** DELETE /api/threats/{id} — Delete threat */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThreat(@PathVariable String id) {
        threatService.deleteThreat(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/threats/severity/{level} — Filter by severity */
    @GetMapping("/severity/{level}")
    public ResponseEntity<List<Threat>> getThreatsBySeverity(@PathVariable String level) {
        ThreatSeverity severity = ThreatSeverity.valueOf(level.toUpperCase());
        return ResponseEntity.ok(threatService.getThreatsBySeverity(severity));
    }

    /** GET /api/threats/status/{status} — Filter by status */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Threat>> getThreatsByStatus(@PathVariable String status) {
        ThreatStatus threatStatus = ThreatStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(threatService.getThreatsByStatus(threatStatus));
    }

    /** GET /api/threats/type/{type} — Filter by type */
    @GetMapping("/type/{type}")
    public ResponseEntity<List<Threat>> getThreatsByType(@PathVariable String type) {
        ThreatType threatType = ThreatType.valueOf(type.toUpperCase());
        return ResponseEntity.ok(threatService.getThreatsByType(threatType));
    }

    /** GET /api/threats/active — Get all non-mitigated threats */
    @GetMapping("/active")
    public ResponseEntity<List<Threat>> getActiveThreats() {
        return ResponseEntity.ok(threatService.getActiveThreats());
    }

    /** GET /api/threats/recent — Get 10 most recent threats */
    @GetMapping("/recent")
    public ResponseEntity<List<Threat>> getRecentThreats() {
        return ResponseEntity.ok(threatService.getRecentThreats());
    }

    /** GET /api/threats/top-scoring — Get 10 highest-scored threats */
    @GetMapping("/top-scoring")
    public ResponseEntity<List<Threat>> getTopScoringThreats() {
        return ResponseEntity.ok(threatService.getTopScoringThreats());
    }
}
