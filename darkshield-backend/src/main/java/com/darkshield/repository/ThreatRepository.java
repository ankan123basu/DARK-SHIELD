package com.darkshield.repository;

import com.darkshield.model.Threat;
import com.darkshield.model.enums.ThreatSeverity;
import com.darkshield.model.enums.ThreatStatus;
import com.darkshield.model.enums.ThreatType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ThreatRepository extends MongoRepository<Threat, String> {

    List<Threat> findBySeverity(ThreatSeverity severity);

    List<Threat> findByStatus(ThreatStatus status);

    List<Threat> findByType(ThreatType type);

    List<Threat> findByStatusNot(ThreatStatus status);

    List<Threat> findByThreatScoreGreaterThanEqual(int score);

    List<Threat> findByDetectedAtBetween(LocalDateTime start, LocalDateTime end);

    List<Threat> findByReportedBy(String userId);

    long countBySeverity(ThreatSeverity severity);

    long countByStatus(ThreatStatus status);

    long countByType(ThreatType type);

    List<Threat> findTop10ByOrderByDetectedAtDesc();

    List<Threat> findTop10ByOrderByThreatScoreDesc();
}
