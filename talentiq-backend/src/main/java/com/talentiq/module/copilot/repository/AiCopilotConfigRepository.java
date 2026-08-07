package com.talentiq.module.copilot.repository;

import com.talentiq.module.copilot.entity.AiCopilotConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiCopilotConfigRepository extends JpaRepository<AiCopilotConfig, Long> {
    Optional<AiCopilotConfig> findByHrId(Long hrId);
}
