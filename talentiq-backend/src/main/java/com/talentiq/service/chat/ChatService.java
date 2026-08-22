package com.talentiq.service.chat;

import com.talentiq.dto.chat.ChatMessageDto;

import java.util.List;

public interface ChatService {

    /**
     * Persist a chat message and push it in real-time to the receiver.
     */
    ChatMessageDto.MessageResponse sendMessage(Long senderId, ChatMessageDto.SendRequest request);

    /**
     * Relay a WebRTC signaling payload (SDP offer/answer/ICE) to the target peer.
     * These are NOT persisted to the DB.
     */
    void relaySignal(Long senderId, ChatMessageDto.SignalPayload signal);

    /**
     * Broadcast a typing indicator to the receiver.
     * Not persisted.
     */
    void broadcastTyping(Long senderId, Long receiverId, boolean isTyping);

    /**
     * Fetch the message history between two users (last 100 messages).
     */
    List<ChatMessageDto.MessageResponse> getConversation(Long userId1, Long userId2);

    /**
     * Fetch contacts list for a user (people they have chatted with or applied to/received applications from).
     */
    List<ChatMessageDto.ContactResponse> getContacts(Long currentUserId);
}
