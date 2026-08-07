package com.talentiq.module.hr.repository;

import com.talentiq.module.hr.entity.HrProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HrProfileRepository extends JpaRepository<HrProfile, Long> {

    Optional<HrProfile> findByUserId(Long userId);

    List<HrProfile> findAllByCompanyId(Long companyId);

    boolean existsByUserId(Long userId);
}
