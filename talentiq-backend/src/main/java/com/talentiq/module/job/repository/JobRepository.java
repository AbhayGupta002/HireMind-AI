package com.talentiq.module.job.repository;

import com.talentiq.module.job.entity.Job;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobRepository extends JpaRepository<Job, Long>, JpaSpecificationExecutor<Job> {

    Optional<Job> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = {"company", "requiredSkills"})
    Page<Job> findAllByCompanyId(Long companyId, Pageable pageable);

    @Query("SELECT j FROM Job j JOIN FETCH j.company WHERE j.status = 'ACTIVE' AND (j.expiresAt IS NULL OR j.expiresAt > CURRENT_TIMESTAMP)")
    Page<Job> findActiveJobs(Pageable pageable);
}
