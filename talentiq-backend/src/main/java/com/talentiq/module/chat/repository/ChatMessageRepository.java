package com.talentiq.module.chat.repository;

import com.talentiq.module.chat.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Fetch the conversation thread between two users (bidirectional), newest first.
     */
    @Query("""
            SELECT m FROM ChatMessage m
            WHERE (m.senderId = :userId1 AND m.receiverId = :userId2)
               OR (m.senderId = :userId2 AND m.receiverId = :userId1)
            ORDER BY m.sentAt ASC
            """)
    List<ChatMessage> findConversation(
            @Param("userId1") Long userId1,
            @Param("userId2") Long userId2,
            Pageable pageable
    );

    /**
     * Distinct IDs of all users who have sent or received messages with this user.
     */
    @Query("""
            SELECT DISTINCT CASE
              WHEN m.senderId = :userId THEN m.receiverId
              ELSE m.senderId
            END
            FROM ChatMessage m
            WHERE m.senderId = :userId OR m.receiverId = :userId
            """)
    List<Long> findContactIds(@Param("userId") Long userId);

    /**
     * Count unread messages sent to this user by a specific sender.
     */
    long countBySenderIdAndReceiverIdAndReadFalse(Long senderId, Long receiverId);
}
