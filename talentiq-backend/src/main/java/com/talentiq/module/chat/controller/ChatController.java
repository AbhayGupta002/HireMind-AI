package com.talentiq.module.chat.controller;

import com.talentiq.common.response.ApiResponse;
import com.talentiq.module.chat.dto.ChatMessageDto;
import com.talentiq.module.chat.service.ChatService;
import com.talentiq.security.userdetails.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

/**
 * Chat controller: handles both STOMP WebSocket message routing and REST history/contacts APIs.
 *
 * WebSocket topics:
 *   /app/chat.send      — send a text message
 *   /app/chat.signal    — relay WebRTC signaling (offer/answer/ICE)
 *   /app/chat.typing    — typing indicator
 *
 * Personal queues subscribed by client:
 *   /user/queue/chat     — new incoming messages
 *   /user/queue/signal   — WebRTC signaling
 *   /user/queue/typing   — typing events
 */
@RestController
@RequestMapping("/v1/chat")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Real-Time Chat", description = "WebSocket STOMP messaging + REST history APIs")
public class ChatController {

    private final ChatService chatService;

    // ── STOMP WebSocket Handlers ────────────────────────────────────────────────

    /**
     * Client sends: STOMP SEND /app/chat.send
     * Server routes message to: /user/{receiverId}/queue/chat
     */
    @MessageMapping("/chat.send")
    public void handleChatMessage(@Payload ChatMessageDto.SendRequest request,
                                  SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) {
            log.warn("Unauthenticated WebSocket message rejected");
            return;
        }
        Long senderId = Long.parseLong(principal.getName());
        chatService.sendMessage(senderId, request);
    }

    /**
     * WebRTC signaling relay — SDP offer/answer/ICE candidates.
     * Client sends: STOMP SEND /app/chat.signal
     */
    @MessageMapping("/chat.signal")
    public void handleSignal(@Payload ChatMessageDto.SignalPayload signal,
                             SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        Long senderId = Long.parseLong(principal.getName());
        chatService.relaySignal(senderId, signal);
    }

    /**
     * Typing indicator — ephemeral, not persisted.
     * Client sends: STOMP SEND /app/chat.typing
     */
    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload ChatMessageDto.TypingPayload payload,
                             SimpMessageHeaderAccessor headerAccessor) {
        Principal principal = headerAccessor.getUser();
        if (principal == null) return;
        Long senderId = Long.parseLong(principal.getName());
        chatService.broadcastTyping(senderId, payload.getReceiverId(), payload.isTyping());
    }

    // ── REST APIs ───────────────────────────────────────────────────────────────

    @GetMapping("/conversations/{otherUserId}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get message history between current user and another user")
    public ResponseEntity<ApiResponse<List<ChatMessageDto.MessageResponse>>> getConversation(
            @PathVariable Long otherUserId,
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ChatMessageDto.MessageResponse> messages =
                chatService.getConversation(principal.getId(), otherUserId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @GetMapping("/contacts")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get list of chat contacts for the current user")
    public ResponseEntity<ApiResponse<List<ChatMessageDto.ContactResponse>>> getContacts(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ChatMessageDto.ContactResponse> contacts = chatService.getContacts(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(contacts));
    }
}
