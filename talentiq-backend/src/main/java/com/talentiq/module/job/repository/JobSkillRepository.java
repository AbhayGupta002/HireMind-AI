package com.talentiq.module.job.repository;

import com.talentiq.module.job.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {
    List<JobSkill> findByJobIdOrderByDisplayOrderAsc(Long jobId);
}
