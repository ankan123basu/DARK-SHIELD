package com.darkshield.controller;

import com.darkshield.dto.DashboardStats;
import com.darkshield.model.Threat;
import com.darkshield.service.DashboardService;
import com.darkshield.service.ThreatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Dashboard REST Controller providing aggregated SOC metrics.
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Autowired
    private ThreatService threatService;

    /** GET /api/dashboard/stats — Get aggregated SOC statistics */
    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(dashboardService.getStats());
    }

    /** GET /api/dashboard/threat-timeline — Get recent threats for timeline visualization */
    @GetMapping("/threat-timeline")
    public ResponseEntity<List<Threat>> getThreatTimeline() {
        return ResponseEntity.ok(threatService.getRecentThreats());
    }

    /** GET /api/dashboard/top-threats — Get highest-scoring threats */
    @GetMapping("/top-threats")
    public ResponseEntity<List<Threat>> getTopThreats() {
        return ResponseEntity.ok(threatService.getTopScoringThreats());
    }
}
