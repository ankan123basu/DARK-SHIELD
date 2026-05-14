package com.darkshield.model;

import com.darkshield.model.enums.AssetStatus;
import com.darkshield.model.enums.AssetType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Network Asset entity representing a monitored device/resource.
 * Tracks risk scores, vulnerabilities, and operational status
 * for the 3D network topology visualization.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "assets")
public class Asset {

    @Id
    private String id;

    private String hostname;

    @Indexed(unique = true)
    private String ipAddress;

    private AssetType type;

    private String operatingSystem;

    @Builder.Default
    private AssetStatus status = AssetStatus.ONLINE;

    /** Risk score (0-100) based on vulnerabilities and exposure */
    @Builder.Default
    private int riskScore = 0;

    @Builder.Default
    private List<String> openPorts = new ArrayList<>();

    @Builder.Default
    private List<String> vulnerabilities = new ArrayList<>();

    private String department;

    private String location;

    /** Connection IDs for 3D network topology graph edges */
    @Builder.Default
    private List<String> connectedAssetIds = new ArrayList<>();

    private LocalDateTime lastScanAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
