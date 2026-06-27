package com.devsimulator.model;

public class TaskObjective {
    private final String id;
    private final ObjectiveType type;
    private final String label;
    private final String contactId;

    private final String messageId;
    private final String correctReplyId;
    private boolean completed;
    public TaskObjective(String id, ObjectiveType type, String label) {
        this(id, type, label, null, null, null);
    }

    public TaskObjective(String id, ObjectiveType type, String label,
                         String contactId, String messageId, String correctReplyId) {
        this.id = id;
        this.type = type;
        this.label = label;
        this.contactId = contactId;
        this.messageId = messageId;
        this.correctReplyId = correctReplyId;
        this.completed = false;
    }

    public String getId() {
        return id;
    }

    public ObjectiveType getType() {
        return type;
    }

    public String getLabel() {
        return label;
    }

    public String getContactId() {
        return contactId;
    }

    public String getMessageId() {
        return messageId;
    }

    public String getCorrectReplyId() {
        return correctReplyId;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void complete() {
        completed = true;
    }

    public void reset() {
        completed = false;
    }

    public static TaskObjective restored(String id, ObjectiveType type, String label,
                                         String contactId, String messageId, String correctReplyId,
                                         boolean completed) {
        TaskObjective objective = new TaskObjective(id, type, label, contactId, messageId, correctReplyId);
        if (completed) {
            objective.complete();
        }
        return objective;
    }
}
