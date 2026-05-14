package com.darkshield.controller;

import com.darkshield.dto.AssetRequest;
import com.darkshield.model.Asset;
import com.darkshield.model.enums.AssetStatus;
import com.darkshield.service.AssetService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Network Asset REST Controller.
 * CRUD operations for monitored network devices and resources.
 * Delete operations require ADMIN role.
 */
@RestController
@RequestMapping("/api/assets")
public class AssetController {

    @Autowired
    private AssetService assetService;

    /** GET /api/assets — List all assets */
    @GetMapping
    public ResponseEntity<List<Asset>> getAllAssets() {
        return ResponseEntity.ok(assetService.getAllAssets());
    }

    /** GET /api/assets/{id} — Get asset by ID */
    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable String id) {
        return ResponseEntity.ok(assetService.getAssetById(id));
    }

    /** POST /api/assets — Register new network asset */
    @PostMapping
    public ResponseEntity<Asset> createAsset(@Valid @RequestBody AssetRequest request) {
        Asset created = assetService.createAsset(request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /** PUT /api/assets/{id} — Update asset details */
    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(@PathVariable String id,
                                              @RequestBody AssetRequest request) {
        return ResponseEntity.ok(assetService.updateAsset(id, request));
    }

    /** DELETE /api/assets/{id} — Remove asset (ADMIN only) */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Void> deleteAsset(@PathVariable String id) {
        assetService.deleteAsset(id);
        return ResponseEntity.noContent().build();
    }

    /** GET /api/assets/status/{status} — Filter by status */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Asset>> getAssetsByStatus(@PathVariable String status) {
        AssetStatus assetStatus = AssetStatus.valueOf(status.toUpperCase());
        return ResponseEntity.ok(assetService.getAssetsByStatus(assetStatus));
    }

    /** GET /api/assets/high-risk — Get assets with risk score >= 70 */
    @GetMapping("/high-risk")
    public ResponseEntity<List<Asset>> getHighRiskAssets() {
        return ResponseEntity.ok(assetService.getHighRiskAssets());
    }
}
