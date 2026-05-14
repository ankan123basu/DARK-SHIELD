package com.darkshield.dto;

import com.darkshield.model.enums.IncidentSeverity;
import com.darkshield.model.enums.IncidentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Severity is required")
    private IncidentSeverity severity;

    private IncidentStatus status;

    private String assignedTo;

    private List<String> relatedThreats;

    private List<String> affectedAssets;

    private String resolutionNotes;
}
