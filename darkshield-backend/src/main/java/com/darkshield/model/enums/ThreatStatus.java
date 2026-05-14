package com.darkshield.model.enums;

/**
 * Lifecycle status of a threat through the investigation pipeline.
 */
public enum ThreatStatus {
    NEW,
    ANALYZING,
    CONFIRMED,
    MITIGATED,
    FALSE_POSITIVE
}
