package com.darkshield.service;

import com.darkshield.dto.AssetRequest;
import com.darkshield.exception.DuplicateResourceException;
import com.darkshield.exception.ResourceNotFoundException;
import com.darkshield.model.Asset;
import com.darkshield.model.enums.AssetStatus;
import com.darkshield.model.enums.AssetType;
import com.darkshield.repository.AssetRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service for network asset management.
 * Handles CRUD, risk scoring based on vulnerabilities, and topology data.
 */
@Service
public class AssetService {

    @Autowired
    private AssetRepository assetRepository;

    @Autowired
    private AuditLogService auditLogService;

    public Asset createAsset(AssetRequest request) {
        if (assetRepository.existsByIpAddress(request.getIpAddress())) {
            throw new DuplicateResourceException("Asset", "ipAddress", request.getIpAddress());
        }

        Asset asset = Asset.builder()
                .hostname(request.getHostname())
                .ipAddress(request.getIpAddress())
                .type(request.getType())
                .operatingSystem(request.getOperatingSystem())
                .status(request.getStatus() != null ? request.getStatus() : AssetStatus.ONLINE)
                .openPorts(request.getOpenPorts())
                .vulnerabilities(request.getVulnerabilities())
                .department(request.getDepartment())
                .location(request.getLocation())
                .connectedAssetIds(request.getConnectedAssetIds())
                .lastScanAt(LocalDateTime.now())
                .build();

        // Calculate risk score based on vulnerabilities and open ports
        asset.setRiskScore(calculateRiskScore(asset));

        Asset saved = assetRepository.save(asset);

        auditLogService.log("CREATE_ASSET", "Asset", saved.getId(),
                String.format("Created asset '%s' (%s) with risk score %d",
                        saved.getHostname(), saved.getIpAddress(), saved.getRiskScore()));

        return saved;
    }

    public List<Asset> getAllAssets() {
        return assetRepository.findAll();
    }

    public Asset getAssetById(String id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset", "id", id));
    }

    public List<Asset> getAssetsByStatus(AssetStatus status) {
        return assetRepository.findByStatus(status);
    }

    public List<Asset> getAssetsByType(AssetType type) {
        return assetRepository.findByType(type);
    }

    public List<Asset> getHighRiskAssets() {
        return assetRepository.findByRiskScoreGreaterThanEqual(70);
    }

    public Asset updateAsset(String id, AssetRequest request) {
        Asset asset = getAssetById(id);

        if (request.getHostname() != null) asset.setHostname(request.getHostname());
        if (request.getIpAddress() != null) asset.setIpAddress(request.getIpAddress());
        if (request.getType() != null) asset.setType(request.getType());
        if (request.getOperatingSystem() != null) asset.setOperatingSystem(request.getOperatingSystem());
        if (request.getStatus() != null) asset.setStatus(request.getStatus());
        if (request.getOpenPorts() != null) asset.setOpenPorts(request.getOpenPorts());
        if (request.getVulnerabilities() != null) asset.setVulnerabilities(request.getVulnerabilities());
        if (request.getDepartment() != null) asset.setDepartment(request.getDepartment());
        if (request.getLocation() != null) asset.setLocation(request.getLocation());
        if (request.getConnectedAssetIds() != null) asset.setConnectedAssetIds(request.getConnectedAssetIds());

        // Recalculate risk score
        asset.setRiskScore(calculateRiskScore(asset));

        Asset updated = assetRepository.save(asset);

        auditLogService.log("UPDATE_ASSET", "Asset", id,
                String.format("Updated asset '%s' (risk: %d)", asset.getHostname(), asset.getRiskScore()));

        return updated;
    }

    public void deleteAsset(String id) {
        Asset asset = getAssetById(id);
        assetRepository.delete(asset);
        auditLogService.log("DELETE_ASSET", "Asset", id,
                "Deleted asset: " + asset.getHostname());
    }

    /**
     * Calculate risk score based on vulnerabilities, open ports, and status.
     * Score range: 0-100
     */
    private int calculateRiskScore(Asset asset) {
        int score = 0;

        // Vulnerability count (each vuln = +12 points, max 60)
        if (asset.getVulnerabilities() != null) {
            score += Math.min(asset.getVulnerabilities().size() * 12, 60);
        }

        // Open port count (each port = +3 points, max 20)
        if (asset.getOpenPorts() != null) {
            score += Math.min(asset.getOpenPorts().size() * 3, 20);
        }

        // Status-based modifier
        if (asset.getStatus() == AssetStatus.COMPROMISED) score += 20;
        else if (asset.getStatus() == AssetStatus.QUARANTINED) score += 10;

        return Math.min(score, 100);
    }
}
