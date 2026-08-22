package com.talentiq.repository.copilot;

import com.talentiq.model.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {
    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
