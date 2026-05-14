package com.darkshield.service;

import com.darkshield.model.Threat;
import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * ★ KEY DIFFERENTIATOR — Custom Threat Intelligence Scoring Engine.
 * 
 * Computes a composite threat score (0–100) based on multiple weighted factors:
 * 
 * threatScore = baseScore(severity) 
 *     + typeMultiplier(threatType) 
 *     + recencyBonus(detectedAt)
 *     + indicatorWeight(IOC count)
 *     + mitreAttackWeight(technique count)
 * 
 * Scores >= 75 trigger automatic incident escalation via AutoEscalationService.
 * 
 * Factor Weights:
 * - Base severity score:     0-40 points (CRITICAL=40, HIGH=30, MEDIUM=20, LOW=10, INFO=5)
 * - Threat type multiplier:  0-25 points (ZERO_DAY=25, APT=22, RANSOMWARE=20, etc.)
 * - Recency bonus:           0-15 points (detected within last 24h gets max bonus)
 * - IOC indicator count:     0-10 points (each unique IOC adds 2 points, capped at 10)
 * - MITRE ATT&CK mapping:   0-10 points (each mapped technique adds 2.5 points, capped at 10)
 */
@Service
public class ThreatScoringEngine {

    private static final Logger logger = LoggerFactory.getLogger(ThreatScoringEngine.class);

    // Escalation threshold — scores at or above this trigger auto-incident creation
    public static final int ESCALATION_THRESHOLD = 75;

    /**
     * Calculate the composite threat score for a given threat.
     * @return Score between 0 and 100
     */
    public int calculateThreatScore(Threat threat) {
        double score = 0;

        // Factor 1: Base severity score (0-40)
        score += getSeverityBaseScore(threat.getSeverity());

        // Factor 2: Threat type multiplier (0-25)
        score += getTypeScore(threat.getType());

        // Factor 3: Recency bonus (0-15)
        score += getRecencyBonus(threat.getDetectedAt());

        // Factor 4: IOC indicator weight (0-10)
        if (threat.getIndicators() != null) {
            score += Math.min(threat.getIndicators().size() * 2, 10);
        }

        // Factor 5: MITRE ATT&CK technique mapping (0-10)
        if (threat.getMitreAttackIds() != null) {
            score += Math.min(threat.getMitreAttackIds().size() * 2.5, 10);
        }

        // Clamp to 0-100 range
        int finalScore = (int) Math.min(Math.max(score, 0), 100);

        logger.info("Threat Score calculated for '{}': {} (severity={}, type={}, indicators={}, mitre={})",
                threat.getTitle(), finalScore, threat.getSeverity(), threat.getType(),
                threat.getIndicators() != null ? threat.getIndicators().size() : 0,
                threat.getMitreAttackIds() != null ? threat.getMitreAttackIds().size() : 0);

        return finalScore;
    }

    /**
     * Check if a threat score meets the escalation threshold.
     */
    public boolean shouldEscalate(int threatScore) {
        return threatScore >= ESCALATION_THRESHOLD;
    }

    private double getSeverityBaseScore(ThreatSeverity severity) {
        if (severity == null) return 5;
        return switch (severity) {
            case CRITICAL -> 40;
            case HIGH -> 30;
            case MEDIUM -> 20;
            case LOW -> 10;
            case INFO -> 5;
        };
    }

    private double getTypeScore(ThreatType type) {
        if (type == null) return 5;
        return switch (type) {
            case ZERO_DAY -> 25;
            case APT -> 22;
            case RANSOMWARE -> 20;
            case INSIDER_THREAT -> 18;
            case MALWARE -> 15;
            case SQL_INJECTION -> 13;
            case DDOS -> 12;
            case PHISHING -> 10;
            case XSS -> 8;
            case BRUTE_FORCE -> 7;
        };
    }

    private double getRecencyBonus(LocalDateTime detectedAt) {
        if (detectedAt == null) return 0;

        long hoursAgo = Duration.between(detectedAt, LocalDateTime.now()).toHours();

        if (hoursAgo <= 1) return 15;       // Within the last hour — maximum urgency
        if (hoursAgo <= 6) return 12;       // Within 6 hours
        if (hoursAgo <= 24) return 9;       // Within 24 hours
        if (hoursAgo <= 72) return 5;       // Within 3 days
        if (hoursAgo <= 168) return 2;      // Within a week
        return 0;                            // Older than a week
    }
}
