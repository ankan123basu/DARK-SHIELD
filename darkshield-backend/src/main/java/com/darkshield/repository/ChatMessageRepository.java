package com.darkshield.repository;

import com.darkshield.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for persisted chat messages.
 */
@Repository
public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    // Fetch last 100 messages for a channel, oldest first
    List<ChatMessage> findTop100ByChannelOrderByCreatedAtAsc(String channel);

    // Fetch DM history between two users (bidirectional)
    @Query("{ $or: [ { sender: ?0, recipient: ?1 }, { sender: ?1, recipient: ?0 } ], channel: 'dm' }")
    List<ChatMessage> findDmHistory(String user1, String user2);
}
