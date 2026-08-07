package com.talentiq.module.candidate.repository;

import com.talentiq.module.candidate.entity.Candidate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long>, JpaSpecificationExecutor<Candidate> {

    Optional<Candidate> findByUserId(Long userId);

    boolean existsByUserId(Long userId);

    @Query("SELECT c FROM Candidate c JOIN c.user u WHERE c.openToWork = true AND u.status = 'ACTIVE'")
    Page<Candidate> findAllOpenToWork(Pageable pageable);

    @Query("SELECT DISTINCT c FROM Candidate c JOIN c.skills s WHERE LOWER(s.skillName) LIKE LOWER(CONCAT('%', :skill, '%'))")
    Page<Candidate> findBySkillName(@Param("skill") String skill, Pageable pageable);
}
