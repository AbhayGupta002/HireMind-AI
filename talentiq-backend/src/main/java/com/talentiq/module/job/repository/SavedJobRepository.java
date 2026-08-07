package com.talentiq.module.job.repository;

import com.talentiq.module.job.entity.SavedJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    Optional<SavedJob> findByUserIdAndJobId(Long userId, Long jobId);

    boolean existsByUserIdAndJobId(Long userId, Long jobId);

    Page<SavedJob> findAllByUserId(Long userId, Pageable pageable);

    void deleteByUserIdAndJobId(Long userId, Long jobId);
}
