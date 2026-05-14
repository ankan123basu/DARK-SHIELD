package com.darkshield.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Chat message payload for WebSocket real-time communication.
 * Not persisted to MongoDB — in-memory relay only.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessage {

    public enum MessageType { CHAT, JOIN, LEAVE, SYSTEM }

    private MessageType type;
    private String channel;     // "all" | "hunters" | "analysts" | "admins" | "dm"
    private String sender;      // username
    private String senderRole;  // ROLE_ADMIN | ROLE_HUNTER | ROLE_ANALYST
    private String recipient;   // for DMs — target username
    private String content;
    private String timestamp;   // ISO string
}
