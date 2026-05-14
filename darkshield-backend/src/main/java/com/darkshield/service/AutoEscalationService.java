package com.darkshield.service;

import com.darkshield.model.Incident;
import com.darkshield.model.Threat;
import com.darkshield.model.enums.IncidentSeverity;
import com.darkshield.model.enums.IncidentStatus;
import com.darkshield.repository.IncidentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * ★ KEY DIFFERENTIATOR — Automatic Incident Escalation Service.
 *
 * When the ThreatScoringEngine calculates a score >= 75 (ESCALATION_THRESHOLD),
 * this service automatically:
 * 1. Creates a P1 (Critical) incident linked to the threat
 * 2. Adds a timeline entry documenting the auto-escalation
 * 3. Logs the escalation action to the audit trail
 *
 * This simulates real-world SOC automation where high-severity threats
 * bypass manual triage and immediately create actionable incidents.
 */
@Service
public class AutoEscalationService {

    private static final Logger logger = LoggerFactory.getLogger(AutoEscalationService.class);

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AuditLogService auditLogService;

    /**
     * Automatically escalate a high-scoring threat into a P1 incident.
     * Called by ThreatService when a threat score exceeds the threshold.
     *
     * @param threat The high-severity threat to escalate
     * @return The created incident, or null if escalation was not needed
     */
    public Incident escalateThreat(Threat threat) {
        if (threat.getThreatScore() < ThreatScoringEngine.ESCALATION_THRESHOLD) {
            return null;
        }

        logger.warn("⚠️ AUTO-ESCALATION TRIGGERED for threat '{}' (score: {})",
                threat.getTitle(), threat.getThreatScore());

        // Build incident from the threat
        Incident incident = Incident.builder()
                .title("[AUTO-ESCALATED] " + threat.getTitle())
                .description(String.format(
                        "Automatically escalated from threat ID: %s\n" +
                        "Threat Score: %d/100\n" +
                        "Severity: %s\n" +
                        "Type: %s\n" +
                        "Source: %s (%s)\n\n" +
                        "Description: %s",
                        threat.getId(),
                        threat.getThreatScore(),
                        threat.getSeverity(),
                        threat.getType(),
                        threat.getSourceIp() != null ? threat.getSourceIp() : "Unknown",
                        threat.getSourceCountry() != null ? threat.getSourceCountry() : "Unknown",
                        threat.getDescription() != null ? threat.getDescription() : "No description"
                ))
                .severity(mapThreatToIncidentSeverity(threat))
                .status(IncidentStatus.OPEN)
                .relatedThreats(new ArrayList<>(List.of(threat.getId())))
                .affectedAssets(new ArrayList<>())
                .timeline(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .build();

        // Add auto-escalation timeline entry
        Incident.TimelineEntry entry = Incident.TimelineEntry.builder()
                .action("INCIDENT_CREATED")
                .performedBy("SYSTEM (Auto-Escalation)")
                .details(String.format(
                        "Incident auto-created due to threat score %d exceeding threshold %d",
                        threat.getThreatScore(), ThreatScoringEngine.ESCALATION_THRESHOLD
                ))
                .timestamp(LocalDateTime.now())
                .build();
        incident.getTimeline().add(entry);

        Incident saved = incidentRepository.save(incident);

        // Log to audit trail
        auditLogService.logSystem(
                "AUTO_ESCALATE",
                "Incident",
                saved.getId(),
                String.format("Auto-created P1 incident from threat '%s' (score: %d)",
                        threat.getTitle(), threat.getThreatScore())
        );

        logger.info("✅ Auto-escalation complete. Incident ID: {}", saved.getId());
        return saved;
    }

    /**
     * Map threat severity to incident priority level.
     * CRITICAL threats → P1, HIGH → P2, etc.
     */
    private IncidentSeverity mapThreatToIncidentSeverity(Threat threat) {
        if (threat.getThreatScore() >= 90) return IncidentSeverity.P1;
        if (threat.getThreatScore() >= 75) return IncidentSeverity.P1;
        if (threat.getThreatScore() >= 50) return IncidentSeverity.P2;
        return IncidentSeverity.P3;
    }
}
