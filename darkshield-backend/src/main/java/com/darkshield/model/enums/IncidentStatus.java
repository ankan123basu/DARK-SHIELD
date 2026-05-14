package com.darkshield.model.enums;

/**
 * Incident response lifecycle following NIST framework stages.
 */
public enum IncidentStatus {
    OPEN,
    INVESTIGATING,
    CONTAINMENT,
    ERADICATION,
    RECOVERY,
    CLOSED
}
