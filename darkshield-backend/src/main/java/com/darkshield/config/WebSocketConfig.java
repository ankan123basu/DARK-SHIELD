package com.darkshield.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration for real-time SOC team communication.
 * Uses STOMP over native WebSocket (SockJS removed in Spring 7).
 *
 * Topic channels:
 *   /topic/chat/all       — Universal (all roles)
 *   /topic/chat/hunters   — Hunters only
 *   /topic/chat/analysts  — Analysts only
 *   /topic/chat/admins    — Admins only
 *   /topic/chat/dm/{user} — Direct message to specific user
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Native WebSocket only — SockJS is not available in Spring 7
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
    }
}
