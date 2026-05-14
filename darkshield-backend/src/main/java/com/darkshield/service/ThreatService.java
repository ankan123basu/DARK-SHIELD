package com.darkshield.service;

import com.darkshield.dto.ThreatRequest;
import com.darkshield.exception.ResourceNotFoundException;
import com.darkshield.model.Threat;
import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatStatus;
import com.darkshield.model.enums.ThreatType;
import com.darkshield.repository.ThreatRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service layer for Threat Intelligence CRUD operations.
 * Integrates with ThreatScoringEngine for automatic score calculation
 * and AutoEscalationService for critical threat escalation.
 */
@Service
public class ThreatService {

    private static final Logger logger = LoggerFactory.getLogger(ThreatService.class);

    @Autowired
    private ThreatRepository threatRepository;

    @Autowired
    private ThreatScoringEngine scoringEngine;

    @Autowired
    private AutoEscalationService autoEscalationService;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Create a new threat with automatic score calculation.
     * If score exceeds threshold, automatically creates a P1 incident.
     */
    public Threat createThreat(ThreatRequest request) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication().getName();

        Threat threat = Threat.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .type(request.getType())
                .severity(request.getSeverity())
                .source(request.getSource())
                .sourceIp(request.getSourceIp())
                .targetIp(request.getTargetIp())
                .sourceLatitude(request.getSourceLatitude())
                .sourceLongitude(request.getSourceLongitude())
                .targetLatitude(request.getTargetLatitude())
                .targetLongitude(request.getTargetLongitude())
                .sourceCountry(request.getSourceCountry())
                .indicators(request.getIndicators())
                .mitreAttackIds(request.getMitreAttackIds())
                .status(ThreatStatus.NEW)
                .reportedBy(currentUser)
                .detectedAt(LocalDateTime.now())
                .build();

        // ★ Auto-calculate threat score
        int score = scoringEngine.calculateThreatScore(threat);
        threat.setThreatScore(score);

        Threat saved = threatRepository.save(threat);

        auditLogService.log("CREATE_THREAT", "Threat", saved.getId(),
                String.format("Created threat '%s' with score %d", saved.getTitle(), score));

        // ★ Auto-escalation check
        if (scoringEngine.shouldEscalate(score)) {
            autoEscalationService.escalateThreat(saved);
        }

        return saved;
    }

    public List<Threat> getAllThreats() {
        return threatRepository.findAll();
    }

    public Threat getThreatById(String id) {
        return threatRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Threat", "id", id));
    }

    public List<Threat> getThreatsBySeverity(ThreatSeverity severity) {
        return threatRepository.findBySeverity(severity);
    }

    public List<Threat> getThreatsByStatus(ThreatStatus status) {
        return threatRepository.findByStatus(status);
    }

    public List<Threat> getThreatsByType(ThreatType type) {
        return threatRepository.findByType(type);
    }

    public List<Threat> getActiveThreats() {
        return threatRepository.findByStatusNot(ThreatStatus.MITIGATED);
    }

    public List<Threat> getRecentThreats() {
        return threatRepository.findTop10ByOrderByDetectedAtDesc();
    }

    public List<Threat> getTopScoringThreats() {
        return threatRepository.findTop10ByOrderByThreatScoreDesc();
    }

    /**
     * Update a threat and recalculate the threat score.
     */
    public Threat updateThreat(String id, ThreatRequest request) {
        Threat threat = getThreatById(id);

        if (request.getTitle() != null) threat.setTitle(request.getTitle());
        if (request.getDescription() != null) threat.setDescription(request.getDescription());
        if (request.getType() != null) threat.setType(request.getType());
        if (request.getSeverity() != null) threat.setSeverity(request.getSeverity());
        if (request.getSource() != null) threat.setSource(request.getSource());
        if (request.getSourceIp() != null) threat.setSourceIp(request.getSourceIp());
        if (request.getTargetIp() != null) threat.setTargetIp(request.getTargetIp());
        if (request.getSourceLatitude() != null) threat.setSourceLatitude(request.getSourceLatitude());
        if (request.getSourceLongitude() != null) threat.setSourceLongitude(request.getSourceLongitude());
        if (request.getTargetLatitude() != null) threat.setTargetLatitude(request.getTargetLatitude());
        if (request.getTargetLongitude() != null) threat.setTargetLongitude(request.getTargetLongitude());
        if (request.getSourceCountry() != null) threat.setSourceCountry(request.getSourceCountry());
        if (request.getIndicators() != null) threat.setIndicators(request.getIndicators());
        if (request.getMitreAttackIds() != null) threat.setMitreAttackIds(request.getMitreAttackIds());
        if (request.getStatus() != null) threat.setStatus(request.getStatus());

        // ★ Recalculate threat score on update
        int newScore = scoringEngine.calculateThreatScore(threat);
        int oldScore = threat.getThreatScore();
        threat.setThreatScore(newScore);

        Threat updated = threatRepository.save(threat);

        auditLogService.log("UPDATE_THREAT", "Threat", id,
                String.format("Updated threat '%s' (score: %d → %d)", threat.getTitle(), oldScore, newScore));

        // Check if score crossed escalation threshold
        if (newScore >= ThreatScoringEngine.ESCALATION_THRESHOLD && oldScore < ThreatScoringEngine.ESCALATION_THRESHOLD) {
            autoEscalationService.escalateThreat(updated);
        }

        return updated;
    }

    public void deleteThreat(String id) {
        Threat threat = getThreatById(id);
        threatRepository.delete(threat);
        auditLogService.log("DELETE_THREAT", "Threat", id,
                "Deleted threat: " + threat.getTitle());
    }
}
