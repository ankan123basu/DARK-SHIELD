package com.darkshield.dto;

import com.darkshield.model.enums.AssetStatus;
import com.darkshield.model.enums.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssetRequest {

    @NotBlank(message = "Hostname is required")
    private String hostname;

    @NotBlank(message = "IP address is required")
    private String ipAddress;

    @NotNull(message = "Asset type is required")
    private AssetType type;

    private String operatingSystem;
    private AssetStatus status;
    private List<String> openPorts;
    private List<String> vulnerabilities;
    private String department;
    private String location;
    private List<String> connectedAssetIds;
}
