package com.talentiq.module.application.repository;

import com.talentiq.module.application.entity.JobApplication;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobApplicationRepository extends JpaRepository<JobApplication, Long> {

    Optional<JobApplication> findByJobIdAndCandidateId(Long jobId, Long candidateId);

    boolean existsByJobIdAndCandidateId(Long jobId, Long candidateId);

    Page<JobApplication> findAllByJobId(Long jobId, Pageable pageable);

    Page<JobApplication> findAllByCandidateId(Long candidateId, Pageable pageable);

    Page<JobApplication> findAllByJobCompanyId(Long companyId, Pageable pageable);
}
