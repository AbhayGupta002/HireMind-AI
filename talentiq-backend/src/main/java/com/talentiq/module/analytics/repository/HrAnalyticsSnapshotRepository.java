package com.talentiq.module.analytics.repository;

import com.talentiq.module.analytics.entity.HrAnalyticsSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HrAnalyticsSnapshotRepository extends JpaRepository<HrAnalyticsSnapshot, Long> {
    Optional<HrAnalyticsSnapshot> findFirstByCompanyIdOrderBySnapshotDateDesc(Long companyId);
}
