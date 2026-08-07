package com.talentiq.module.resume.repository;

import com.talentiq.module.resume.entity.ResumeParsedData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResumeParsedDataRepository extends JpaRepository<ResumeParsedData, Long> {
    Optional<ResumeParsedData> findByResumeId(Long resumeId);
}
