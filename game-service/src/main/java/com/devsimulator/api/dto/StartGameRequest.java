package com.devsimulator.api.dto;

import java.util.List;

public record StartGameRequest(
        String playerName,
        String mode,
        String projectType,
        int age,
        int experienceYears,
        String education,
        List<String> stackSkills,
        Integer wallpaperIndex
) {
}
