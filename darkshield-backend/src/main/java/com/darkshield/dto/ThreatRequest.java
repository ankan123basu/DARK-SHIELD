package com.darkshield.dto;

import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatStatus;
import com.darkshield.model.enums.ThreatType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThreatRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Threat type is required")
    private ThreatType type;

    @NotNull(message = "Severity is required")
    private ThreatSeverity severity;

    private String source;
    private String sourceIp;
    private String targetIp;

    private Double sourceLatitude;
    private Double sourceLongitude;
    private Double targetLatitude;
    private Double targetLongitude;
    private String sourceCountry;

    private List<String> indicators;
    private List<String> mitreAttackIds;
    private ThreatStatus status;
}
