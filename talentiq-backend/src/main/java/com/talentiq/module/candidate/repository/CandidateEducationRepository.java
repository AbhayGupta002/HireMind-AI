package com.talentiq.module.candidate.repository;

import com.talentiq.module.candidate.entity.CandidateEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateEducationRepository extends JpaRepository<CandidateEducation, Long> {
    List<CandidateEducation> findByCandidateIdOrderByStartDateDesc(Long candidateId);
}
