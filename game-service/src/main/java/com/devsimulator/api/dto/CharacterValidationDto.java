package com.devsimulator.api.dto;

import com.devsimulator.service.CharacterValidator;

import java.util.List;

public record CharacterValidationDto(
        boolean valid,
        List<String> errors,
        int previewJavaSkill,
        int previewSoftSkills,
        int previewCodeQuality,
        int previewMoney,
        String careerTitle
) {
    public static CharacterValidationDto from(CharacterValidator.ValidationResult r) {
        return new CharacterValidationDto(
                r.valid(), r.errors(), r.previewJavaSkill(), r.previewSoftSkills(),
                r.previewCodeQuality(), r.previewMoney(), r.careerTitle()
        );
    }
}
