package com.darkshield.repository;

import com.darkshield.model.Asset;
import com.darkshield.model.enums.AssetStatus;
import com.darkshield.model.enums.AssetType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssetRepository extends MongoRepository<Asset, String> {

    Optional<Asset> findByIpAddress(String ipAddress);

    List<Asset> findByStatus(AssetStatus status);

    List<Asset> findByType(AssetType type);

    List<Asset> findByRiskScoreGreaterThanEqual(int score);

    List<Asset> findByDepartment(String department);

    long countByStatus(AssetStatus status);

    long countByType(AssetType type);

    boolean existsByIpAddress(String ipAddress);
}
