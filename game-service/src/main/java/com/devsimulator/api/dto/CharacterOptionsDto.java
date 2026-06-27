package com.devsimulator.api.dto;

import com.devsimulator.model.EducationLevel;
import com.devsimulator.service.CharacterValidator;

import java.util.Arrays;
import java.util.List;

public record CharacterOptionsDto(
        List<EducationOptionDto> educationLevels,
        List<String> stackSkills,
        int minAge,
        int maxAge,
        int maxExperience,
        int maxStackSkills
) {
    public record OptionDto(String id, String label) {
    }

    public record EducationOptionDto(String id, String label, int minAge, int maxAge, int maxExp) {
    }

    public static CharacterOptionsDto create() {
        return new CharacterOptionsDto(
                Arrays.stream(EducationLevel.values())
                        .map(e -> new EducationOptionDto(
                                e.name(), e.getLabel(), e.getMinAge(), e.getMaxAge(), e.getMaxExp()))
                        .toList(),
                CharacterValidator.AVAILABLE_STACK,
                CharacterValidator.MIN_AGE,
                CharacterValidator.MAX_AGE,
                40,
                CharacterValidator.MAX_STACK_SKILLS
        );
    }
}
