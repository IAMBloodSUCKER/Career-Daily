package com.devsimulator.api.dto;

import com.devsimulator.model.ChatMessage;

public record MessageDto(
        String id,
        String contactId,
        String text,
        boolean fromPlayer,
        boolean read,
        String taskId
) {
    public static MessageDto from(ChatMessage m) {
        return new MessageDto(m.getId(), m.getContactId(), m.getText(),
                m.isFromPlayer(), m.isRead(), m.getTaskId());
    }
}
