package com.talentiq.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time notifications and HR Copilot streaming.
 *
 * Client connects to: ws://host/ws (with SockJS fallback)
 * Subscribe to: /user/queue/notifications
 * Subscribe to: /topic/copilot/{sessionId}
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable simple in-memory broker for topics and queues
        registry.enableSimpleBroker("/topic", "/queue");
        // Prefix for messages routed to @MessageMapping controller methods
        registry.setApplicationDestinationPrefixes("/app");
        // Prefix for user-specific destinations
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")   // Fine-tuned in SecurityConfig CORS
                .withSockJS();                    // SockJS fallback for older clients
    }
}
