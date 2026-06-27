package com.devsimulator.api.dto;

import com.devsimulator.model.ProjectProfile;

import java.util.List;

public record ProjectDto(
        String id,
        String companyName,
        String productName,
        String emoji,
        String tagline,
        String description,
        List<String> techStack,
        String architecture,
        String yourRole,
        String slackChannel,
        List<String> introSteps,
        List<TeamMemberDto> team
) {
    public static ProjectDto from(ProjectProfile p) {
        return new ProjectDto(
                p.type().name(),
                p.companyName(),
                p.productName(),
                p.type().getEmoji(),
                p.tagline(),
                p.description(),
                p.techStack(),
                p.architecture(),
                p.yourRole(),
                p.slackChannel(),
                p.introSteps(),
                p.team().stream().map(TeamMemberDto::from).toList()
        );
    }
}
