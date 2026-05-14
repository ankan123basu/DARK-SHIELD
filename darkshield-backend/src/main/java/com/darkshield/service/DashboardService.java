package com.darkshield.service;

import com.darkshield.dto.DashboardStats;
import com.darkshield.model.Threat;
import com.darkshield.model.enums.*;
import com.darkshield.repository.AssetRepository;
import com.darkshield.repository.IncidentRepository;
import com.darkshield.repository.ThreatRepository;
import com.darkshield.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Dashboard aggregation service providing real-time SOC statistics.
 * Computes metrics across threats, incidents, assets, and users.
 */
@Service
public class DashboardService {

    @Autowired
    private ThreatRepository threatRepository;

    @Autowired
    private IncidentRepository incidentRepository;

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Compute and return aggregated dashboard statistics.
     */
    public DashboardStats getStats() {
        // Threat stats
        long totalThreats = threatRepository.count();
        long activeThreats = threatRepository.countByStatus(ThreatStatus.NEW)
                + threatRepository.countByStatus(ThreatStatus.ANALYZING)
                + threatRepository.countByStatus(ThreatStatus.CONFIRMED);
        long criticalThreats = threatRepository.countBySeverity(ThreatSeverity.CRITICAL);

        // Incident stats
        long totalIncidents = incidentRepository.count();
        long openIncidents = incidentRepository.countByStatus(IncidentStatus.OPEN)
                + incidentRepository.countByStatus(IncidentStatus.INVESTIGATING)
                + incidentRepository.countByStatus(IncidentStatus.CONTAINMENT);

        // Asset stats
        long totalAssets = assetRepository.count();
        long compromisedAssets = assetRepository.countByStatus(AssetStatus.COMPROMISED);

        // User stats
        long totalUsers = userRepository.count();

        // Threats by severity breakdown
        Map<String, Long> threatsBySeverity = new HashMap<>();
        for (ThreatSeverity severity : ThreatSeverity.values()) {
            threatsBySeverity.put(severity.name(), threatRepository.countBySeverity(severity));
        }

        // Threats by type breakdown
        Map<String, Long> threatsByType = new HashMap<>();
        for (ThreatType type : ThreatType.values()) {
            threatsByType.put(type.name(), threatRepository.countByType(type));
        }

        // Incidents by status breakdown
        Map<String, Long> incidentsByStatus = new HashMap<>();
        for (IncidentStatus status : IncidentStatus.values()) {
            incidentsByStatus.put(status.name(), incidentRepository.countByStatus(status));
        }

        // Assets by status breakdown
        Map<String, Long> assetsByStatus = new HashMap<>();
        for (AssetStatus status : AssetStatus.values()) {
            assetsByStatus.put(status.name(), assetRepository.countByStatus(status));
        }

        // Average threat score
        List<Threat> allThreats = threatRepository.findAll();
        double avgScore = allThreats.stream()
                .mapToInt(Threat::getThreatScore)
                .average()
                .orElse(0.0);

        return DashboardStats.builder()
                .totalThreats(totalThreats)
                .activeThreats(activeThreats)
                .criticalThreats(criticalThreats)
                .totalIncidents(totalIncidents)
                .openIncidents(openIncidents)
                .totalAssets(totalAssets)
                .compromisedAssets(compromisedAssets)
                .totalUsers(totalUsers)
                .threatsBySeverity(threatsBySeverity)
                .threatsByType(threatsByType)
                .incidentsByStatus(incidentsByStatus)
                .assetsByStatus(assetsByStatus)
                .averageThreatScore(Math.round(avgScore * 10.0) / 10.0)
                .build();
    }
}
