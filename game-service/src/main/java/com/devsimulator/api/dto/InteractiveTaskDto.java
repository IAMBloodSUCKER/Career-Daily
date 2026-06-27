package com.devsimulator.api.dto;

import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.TaskObjective;

import java.util.List;

public record InteractiveTaskDto(
        String id,
        String ticketId,
        String title,
        String description,
        String type,
        int durationHours,
        String jiraStatus,
        boolean completed,
        boolean focused,
        String primaryContactId,
        List<ObjectiveDto> objectives,
        CodeChallengeDto code,
        List<ReplyOptionDto> replyOptions,
        Integer pullRequestNumber,
        String pullRequestStatus,
        String reviewerContactId,
        String scenarioTag
) {
    public static InteractiveTaskDto from(InteractiveTask t, String focusedId, String currentCode) {
        String primaryContact = t.getObjectives().stream()
                .map(TaskObjective::getContactId)
                .filter(id -> id != null && !id.isBlank())
                .findFirst()
                .orElse(null);
        return new InteractiveTaskDto(
                t.getId(), t.getTicketId(), t.getTitle(), t.getDescription(),
                t.getType().name(), t.getDurationHours(), t.getJiraStatus(),
                t.isCompleted(), t.getId().equals(focusedId), primaryContact,
                t.getObjectives().stream().map(ObjectiveDto::from).toList(),
                CodeChallengeDto.from(t.getCodeChallenge(), currentCode),
                t.getReplyOptions().stream().map(ReplyOptionDto::from).toList(),
                t.getPullRequestNumber() > 0 ? t.getPullRequestNumber() : null,
                "NONE".equals(t.getPullRequestStatus()) ? null : t.getPullRequestStatus(),
                t.getReviewerContactId(),
                t.getScenarioTag().name()
        );
    }
}
