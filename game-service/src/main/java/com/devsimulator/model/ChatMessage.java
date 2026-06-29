package com.devsimulator.model;

public class ChatMessage {
    private final String id;
    private final String contactId;
    private final String text;
    private final boolean fromPlayer;
    private final String taskId;
    private final boolean channel;
    private boolean read;
    private final long timestamp;

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId) {
        this(id, contactId, text, fromPlayer, taskId, false);
    }

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId,
                       boolean channel) {
        this(id, contactId, text, fromPlayer, taskId, fromPlayer, channel, System.currentTimeMillis());
    }

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId,
                       boolean read, long timestamp) {
        this(id, contactId, text, fromPlayer, taskId, read, false, timestamp);
    }

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId,
                       boolean read, boolean channel, long timestamp) {
        this.id = id;
        this.contactId = contactId;
        this.text = text;
        this.fromPlayer = fromPlayer;
        this.taskId = taskId;
        this.channel = channel;
        this.read = read;
        this.timestamp = timestamp;
    }

    /** Сообщение в командном канале (#team-…), не личка. */
    public static ChatMessage channelPost(String id, String contactId, String text) {
        return new ChatMessage(id, contactId, text, false, null, false, true, System.currentTimeMillis());
    }

    public static ChatMessage channelPost(String id, String contactId, String text, long timestamp) {
        return new ChatMessage(id, contactId, text, false, null, false, true, timestamp);
    }

    public String getId() {
        return id;
    }

    public String getContactId() {
        return contactId;
    }

    public String getText() {
        return text;
    }

    public boolean isFromPlayer() {
        return fromPlayer;
    }

    public String getTaskId() {
        return taskId;
    }

    public boolean isChannel() {
        return channel;
    }

    public boolean isRead() {
        return read;
    }

    public void markRead() {
        read = true;
    }

    public long getTimestamp() {
        return timestamp;
    }
}
