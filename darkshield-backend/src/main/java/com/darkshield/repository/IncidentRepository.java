package com.darkshield.repository;

import com.darkshield.model.Incident;
import com.darkshield.model.enums.IncidentSeverity;
import com.darkshield.model.enums.IncidentStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends MongoRepository<Incident, String> {

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByStatusNot(IncidentStatus status);

    List<Incident> findBySeverity(IncidentSeverity severity);

    List<Incident> findByAssignedTo(String userId);

    long countByStatus(IncidentStatus status);

    long countBySeverity(IncidentSeverity severity);

    List<Incident> findTop10ByOrderByCreatedAtDesc();

    List<Incident> findByStatusIn(List<IncidentStatus> statuses);
}
