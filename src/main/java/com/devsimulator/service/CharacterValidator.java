package com.devsimulator.service;

import com.devsimulator.model.CharacterProfile;
import com.devsimulator.model.EducationLevel;

import java.util.ArrayList;
import java.util.List;

public final class CharacterValidator {

    public static final int MIN_AGE = 18;
    public static final int MAX_AGE = 65;
    public static final int MIN_WORKING_AGE = 16;
    public static final List<String> AVAILABLE_STACK = List.of(
            "Java Core", "Spring Boot", "SQL", "Git", "JUnit", "Maven", "REST API", "Kafka"
    );

    private CharacterValidator() {
    }

    public record ValidationResult(
            boolean valid,
            List<String> errors,
            int previewJavaSkill,
            int previewSoftSkills,
            int previewCodeQuality,
            int previewMoney,
            String careerTitle
    ) {
        public static ValidationResult fail(List<String> errors) {
            return new ValidationResult(false, errors, 0, 0, 0, 0, "");
        }
    }

    public static ValidationResult validate(CharacterProfile profile) {
        List<String> errors = new ArrayList<>();

        if (profile.name() == null || profile.name().trim().length() < 2) {
            errors.add("Имя: минимум 2 символа.");
        } else if (profile.name().trim().length() > 40) {
            errors.add("Имя: максимум 40 символов.");
        }

        if (profile.age() < MIN_AGE) {
            errors.add("Возраст: минимум " + MIN_AGE + " лет (вы устроились на работу).");
        } else if (profile.age() > MAX_AGE) {
            errors.add("Возраст: максимум " + MAX_AGE + " лет.");
        }

        if (profile.experienceYears() < 0) {
            errors.add("Опыт не может быть отрицательным.");
        } else if (profile.experienceYears() > 40) {
            errors.add("Опыт: максимум 40 лет.");
        }

        int maxExpByAge = profile.age() - MIN_WORKING_AGE;
        if (profile.age() >= MIN_WORKING_AGE && profile.experienceYears() > maxExpByAge) {
            errors.add("При возрасте " + profile.age() + " максимум " + maxExpByAge
                    + " лет опыта (с " + MIN_WORKING_AGE + " лет).");
        }

        int minAgeForExp = profile.experienceYears() + MIN_WORKING_AGE;
        if (profile.experienceYears() > 0 && profile.age() < minAgeForExp) {
            errors.add("С " + profile.experienceYears() + " годами опыта вам должно быть "
                    + "не меньше " + minAgeForExp + " лет.");
        }

        if (profile.education() != null) {
            EducationLevel edu = profile.education();
            if (profile.age() < edu.getMinAge()) {
                errors.add("Для «" + edu.getLabel() + "» минимальный возраст — " + edu.getMinAge() + ".");
            }
            if (profile.age() > edu.getMaxAge()) {
                errors.add("Для «" + edu.getLabel() + "» максимальный возраст — " + edu.getMaxAge() + ".");
            }
            if (profile.experienceYears() > edu.getMaxExp()) {
                errors.add("Для «" + edu.getLabel() + "» максимум " + edu.getMaxExp() + " лет опыта.");
            }
        }

        if (profile.age() <= 22 && profile.experienceYears() > 4) {
            errors.add("В " + profile.age() + " лет маловероятно иметь " + profile.experienceYears()
                    + " лет опыта разработки.");
        }

        if (profile.stackSkills() == null || profile.stackSkills().isEmpty()) {
            errors.add("Выберите хотя бы один навык из стека.");
        } else if (profile.stackSkills().size() > 6) {
            errors.add("Максимум 6 навыков в стеке.");
        }

        if (profile.experienceYears() >= 10 && profile.stackSkills() != null
                && profile.stackSkills().size() < 2) {
            errors.add("Senior-уровень: укажите минимум 2 навыка.");
        }

        if (!errors.isEmpty()) {
            return ValidationResult.fail(errors);
        }

        int stackBonus = profile.stackSkills() != null ? Math.min(profile.stackSkills().size() * 3, 15) : 0;
        int exp = profile.experienceYears();
        int java = Math.min(15 + exp * 8 + stackBonus, 75);
        int soft = Math.min(10 + exp * 4, 60);
        int code = Math.min(25 + exp * 6 + stackBonus, 70);
        int money = 500 + exp * 120 + (profile.education() == EducationLevel.UNIVERSITY ? 200 : 0);

        String title = careerTitle(exp);
        return new ValidationResult(true, List.of(), java, soft, code, money, title);
    }

    public static String careerTitle(int experienceYears) {
        if (experienceYears == 0) {
            return "Intern / Trainee";
        }
        if (experienceYears <= 2) {
            return "Junior Developer";
        }
        if (experienceYears <= 5) {
            return "Middle Developer";
        }
        return "Senior Developer";
    }

    public static PlayerStats fromValidation(CharacterProfile profile, ValidationResult result) {
        return new PlayerStats(
                profile.name().trim(),
                profile.age(),
                profile.experienceYears(),
                profile.education(),
                profile.stackSkills(),
                result.careerTitle(),
                result.previewJavaSkill(),
                result.previewSoftSkills(),
                result.previewCodeQuality(),
                result.previewMoney()
        );
    }

    public record PlayerStats(
            String name,
            int age,
            int experienceYears,
            EducationLevel education,
            List<String> stackSkills,
            String careerTitle,
            int javaSkill,
            int softSkills,
            int codeQuality,
            int startingMoney
    ) {
    }
}
