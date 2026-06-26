package com.devsimulator.api.dto;

import java.util.List;

public record CharacterCreateRequest(
        String name,
        int age,
        int experienceYears,
        String education,
        List<String> stackSkills
) {
}
