package com.talentiq.service.chat;

import com.talentiq.dto.chat.ChatMessageDto;
import com.talentiq.model.ChatMessage;
import com.talentiq.repository.chat.ChatMessageRepository;
import com.talentiq.model.User;
import com.talentiq.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    public ChatMessageDto.MessageResponse sendMessage(Long senderId, ChatMessageDto.SendRequest request) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderId));

        ChatMessage msg = ChatMessage.builder()
                .senderId(senderId)
                .senderName(sender.getFullName())
                .receiverId(request.getReceiverId())
                .content(request.getContent())
                .type(request.getType() != null ? request.getType() : "TEXT")
                .build();

        ChatMessage saved = chatMessageRepository.save(msg);
        ChatMessageDto.MessageResponse response = toResponse(saved);

        // Push to receiver's personal queue — no page refresh needed
        messagingTemplate.convertAndSendToUser(
                String.valueOf(request.getReceiverId()),
                "/queue/chat",
                response
        );

        log.debug("Message {} -> {} persisted and pushed via WS", senderId, request.getReceiverId());
        return response;
    }

    @Override
    public void relaySignal(Long senderId, ChatMessageDto.SignalPayload signal) {
        signal.setSenderId(senderId);
        // Relay WebRTC signaling payload — never persisted
        messagingTemplate.convertAndSendToUser(
                String.valueOf(signal.getReceiverId()),
                "/queue/signal",
                signal
        );
        log.debug("WebRTC signal '{}' relayed {} -> {}", signal.getSignalType(), senderId, signal.getReceiverId());
    }

    @Override
    public void broadcastTyping(Long senderId, Long receiverId, boolean isTyping) {
        ChatMessageDto.TypingPayload payload = new ChatMessageDto.TypingPayload();
        payload.setSenderId(senderId);
        payload.setReceiverId(receiverId);
        payload.setTyping(isTyping);

        messagingTemplate.convertAndSendToUser(
                String.valueOf(receiverId),
                "/queue/typing",
                payload
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto.MessageResponse> getConversation(Long userId1, Long userId2) {
        return chatMessageRepository
                .findConversation(userId1, userId2, PageRequest.of(0, 100))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageDto.ContactResponse> getContacts(Long currentUserId) {
        List<Long> contactIds = chatMessageRepository.findContactIds(currentUserId);

        return contactIds.stream().map(contactId -> {
            User contact = userRepository.findById(contactId).orElse(null);
            if (contact == null) return null;

            long unread = chatMessageRepository.countBySenderIdAndReceiverIdAndReadFalse(contactId, currentUserId);

            // Get last message
            List<ChatMessage> conv = chatMessageRepository
                    .findConversation(currentUserId, contactId, PageRequest.of(0, 1));

            String lastMsg = "";
            Instant lastMsgAt = null;
            if (!conv.isEmpty()) {
                lastMsg = conv.get(conv.size() - 1).getContent();
                lastMsgAt = conv.get(conv.size() - 1).getSentAt();
            }

            return ChatMessageDto.ContactResponse.builder()
                    .userId(contactId)
                    .name(contact.getFullName())
                    .email(contact.getEmail())
                    .avatarUrl(contact.getAvatarUrl())
                    .unreadCount(unread)
                    .lastMessage(lastMsg.length() > 60 ? lastMsg.substring(0, 60) + "..." : lastMsg)
                    .lastMessageAt(lastMsgAt)
                    .build();
        }).filter(c -> c != null).collect(Collectors.toList());
    }

    private ChatMessageDto.MessageResponse toResponse(ChatMessage msg) {
        return ChatMessageDto.MessageResponse.builder()
                .id(msg.getId())
                .senderId(msg.getSenderId())
                .senderName(msg.getSenderName())
                .receiverId(msg.getReceiverId())
                .content(msg.getContent())
                .type(msg.getType())
                .read(msg.isRead())
                .sentAt(msg.getSentAt())
                .build();
    }
}
