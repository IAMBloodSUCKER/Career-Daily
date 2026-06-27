package com.devsimulator.model;

import java.util.List;

public record ProjectProfile(
        ProjectType type,
        String companyName,
        String productName,
        String tagline,
        String description,
        List<String> techStack,
        String architecture,
        String yourRole,
        List<TeamMemberIntro> team,
        String slackChannel,
        List<String> introSteps
) {
}
