package com.darkshield.model;

import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatStatus;
import com.darkshield.model.enums.ThreatType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Threat Intelligence entity representing a detected cyber threat.
 * Contains IOCs (Indicators of Compromise), MITRE ATT&CK mappings,
 * and geolocation data for 3D globe visualization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "threats")
public class Threat {

    @Id
    private String id;

    private String title;

    private String description;

    private ThreatType type;

    private ThreatSeverity severity;

    /** Auto-calculated threat score (0-100) by ThreatScoringEngine */
    @Builder.Default
    private int threatScore = 0;

    /** Intelligence source (e.g., "VirusTotal", "AlienVault OTX", "Internal Scan") */
    private String source;

    private String sourceIp;

    private String targetIp;

    /** Geolocation for 3D globe attack visualization */
    private Double sourceLatitude;
    private Double sourceLongitude;
    private Double targetLatitude;
    private Double targetLongitude;
    private String sourceCountry;

    /** Indicators of Compromise: file hashes, malicious domains, suspicious IPs */
    @Builder.Default
    private List<String> indicators = new ArrayList<>();

    /** MITRE ATT&CK technique IDs (e.g., T1566, T1190) */
    @Builder.Default
    private List<String> mitreAttackIds = new ArrayList<>();

    @Builder.Default
    private ThreatStatus status = ThreatStatus.NEW;

    /** User ID of the analyst who reported this threat */
    private String reportedBy;

    @CreatedDate
    private LocalDateTime detectedAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
