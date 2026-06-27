package com.devsimulator.api.dto;

import com.devsimulator.model.EmailMessage;

public record EmailDto(
        String id,
        String from,
        String subject,
        String body,
        String category,
        String taskId,
        boolean read
) {
    public static EmailDto from(EmailMessage e) {
        return new EmailDto(
                e.getId(), e.getFrom(), e.getSubject(), e.getBody(),
                e.getCategory(), e.getTaskId(), e.isRead()
        );
    }
}
