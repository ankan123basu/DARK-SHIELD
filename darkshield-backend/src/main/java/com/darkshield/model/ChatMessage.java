package com.darkshield.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.annotation.Collation;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Chat message persisted to MongoDB.
 * Enables chat history to survive page refreshes and server restarts.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "chat_messages")
public class ChatMessage {

    public enum MessageType { CHAT, JOIN, LEAVE, SYSTEM }

    @Id
    private String id;

    private MessageType type;

    @Indexed
    private String channel;     // "all" | "hunters" | "analysts" | "admins" | "dm"

    private String sender;      // username
    private String senderRole;  // ROLE_ADMIN | ROLE_HUNTER | ROLE_ANALYST
    private String recipient;   // for DMs — target username
    private String content;
    private String timestamp;   // ISO string

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
