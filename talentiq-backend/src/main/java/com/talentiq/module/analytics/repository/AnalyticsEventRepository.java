package com.talentiq.module.analytics.repository;

import com.talentiq.module.analytics.entity.AnalyticsEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface AnalyticsEventRepository extends JpaRepository<AnalyticsEvent, Long> {
    long countByEventType(String eventType);
    long countByCreatedAtAfter(Instant after);
}
