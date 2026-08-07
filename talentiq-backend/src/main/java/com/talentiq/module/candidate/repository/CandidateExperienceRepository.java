package com.talentiq.module.candidate.repository;

import com.talentiq.module.candidate.entity.CandidateExperience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateExperienceRepository extends JpaRepository<CandidateExperience, Long> {
    List<CandidateExperience> findByCandidateIdOrderByStartDateDesc(Long candidateId);
}
