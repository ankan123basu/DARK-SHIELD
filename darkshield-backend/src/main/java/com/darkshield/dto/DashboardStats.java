package com.darkshield.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Aggregated dashboard statistics for the SOC overview.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {

    private long totalThreats;
    private long activeThreats;
    private long criticalThreats;
    private long totalIncidents;
    private long openIncidents;
    private long totalAssets;
    private long compromisedAssets;
    private long totalUsers;

    /** Threat count grouped by severity level */
    private Map<String, Long> threatsBySeverity;

    /** Threat count grouped by type */
    private Map<String, Long> threatsByType;

    /** Incident count grouped by status */
    private Map<String, Long> incidentsByStatus;

    /** Asset count grouped by status */
    private Map<String, Long> assetsByStatus;

    /** Average threat score across all active threats */
    private double averageThreatScore;
}
