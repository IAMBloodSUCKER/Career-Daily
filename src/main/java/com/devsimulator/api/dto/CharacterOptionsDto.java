package com.devsimulator.api.dto;

import com.devsimulator.model.EducationLevel;
import com.devsimulator.service.CharacterValidator;

import java.util.Arrays;
import java.util.List;

public record CharacterOptionsDto(
        List<OptionDto> educationLevels,
        List<String> stackSkills,
        int minAge,
        int maxAge,
        int maxExperience
) {
    public record OptionDto(String id, String label) {
    }

    public static CharacterOptionsDto create() {
        return new CharacterOptionsDto(
                Arrays.stream(EducationLevel.values())
                        .map(e -> new OptionDto(e.name(), e.getLabel()))
                        .toList(),
                CharacterValidator.AVAILABLE_STACK,
                CharacterValidator.MIN_AGE,
                CharacterValidator.MAX_AGE,
                40
        );
    }
}
