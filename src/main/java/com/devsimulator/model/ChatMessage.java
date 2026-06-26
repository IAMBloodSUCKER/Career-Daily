package com.devsimulator.model;

public class ChatMessage {
    private final String id;
    private final String contactId;
    private final String text;
    private final boolean fromPlayer;
    private final String taskId;
    private boolean read;
    private final long timestamp;

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId) {
        this(id, contactId, text, fromPlayer, taskId, fromPlayer, System.currentTimeMillis());
    }

    public ChatMessage(String id, String contactId, String text, boolean fromPlayer, String taskId,
                       boolean read, long timestamp) {
        this.id = id;
        this.contactId = contactId;
        this.text = text;
        this.fromPlayer = fromPlayer;
        this.taskId = taskId;
        this.read = read;
        this.timestamp = timestamp;
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
