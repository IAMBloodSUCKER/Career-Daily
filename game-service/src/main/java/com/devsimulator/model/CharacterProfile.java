package com.devsimulator.model;

import java.util.List;

public record CharacterProfile(
        String name,
        int age,
        int experienceYears,
        EducationLevel education,
        List<String> stackSkills
) {
}
