package com.devsimulator.model;

public class EmailMessage {
    private final String id;
    private final String from;
    private final String subject;
    private final String body;
    private final String category;
    private final String taskId;
    private boolean read;

    public EmailMessage(String id, String from, String subject, String body,
                        String category, String taskId) {
        this.id = id;
        this.from = from;
        this.subject = subject;
        this.body = body;
        this.category = category != null ? category : "general";
        this.taskId = taskId;
    }

    public String getId() {
        return id;
    }

    public String getFrom() {
        return from;
    }

    public String getSubject() {
        return subject;
    }

    public String getBody() {
        return body;
    }

    public String getCategory() {
        return category;
    }

    public String getTaskId() {
        return taskId;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }
}
