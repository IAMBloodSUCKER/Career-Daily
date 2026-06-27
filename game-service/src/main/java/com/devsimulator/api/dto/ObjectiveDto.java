package com.devsimulator.api.dto;

import com.devsimulator.model.TaskObjective;

public record ObjectiveDto(String id, String type, String label, boolean completed, String contactId, String stepId) {
    public static ObjectiveDto from(TaskObjective o) {
        return new ObjectiveDto(o.getId(), o.getType().name(), o.getLabel(), o.isCompleted(), o.getContactId(),
                o.getMessageId());
    }
}
