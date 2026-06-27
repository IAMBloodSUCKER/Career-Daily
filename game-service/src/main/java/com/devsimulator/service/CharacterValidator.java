package com.devsimulator.service;

import com.devsimulator.model.CareerTier;
import com.devsimulator.model.CharacterProfile;
import com.devsimulator.model.EducationLevel;
import com.devsimulator.model.ProjectProfile;

import java.util.ArrayList;
import java.util.List;

public final class CharacterValidator {

    public static final int MIN_AGE = 18;
    public static final int MAX_AGE = 65;
    public static final int MIN_WORKING_AGE = 16;
    public static final int MAX_STACK_SKILLS = 8;
    public static final List<String> AVAILABLE_STACK = List.of(
            // Язык и основы
            "Java Core",
            "Collections & Streams",
            "Concurrency",
            // Сборка и инструменты
            "Maven",
            "Gradle",
            "Git",
            "Docker",
            "Linux",
            // Фреймворки
            "Spring Boot",
            "Spring Security",
            "Hibernate/JPA",
            "REST API",
            "gRPC",
            // Данные
            "SQL",
            "PostgreSQL",
            "MongoDB",
            "Redis",
            "Elasticsearch",
            // Интеграции
            "Kafka",
            "RabbitMQ",
            // Тестирование
            "JUnit",
            "Mockito",
            "Integration Tests",
            // Архитектура и платформа
            "Microservices",
            "Design Patterns",
            "Kubernetes",
            "CI/CD"
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
        return validate(profile, null);
    }

    public static ValidationResult validate(CharacterProfile profile, com.devsimulator.model.GameMode mode) {
        List<String> errors = new ArrayList<>();
        boolean explorer = mode == com.devsimulator.model.GameMode.EXPLORER;

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
            validateEducation(profile, errors, mode);
        }

        if (!explorer && profile.age() <= 22 && profile.experienceYears() > 4) {
            errors.add("В " + profile.age() + " лет маловероятно иметь " + profile.experienceYears()
                    + " лет опыта разработки.");
        }

        if (explorer) {
            if (profile.stackSkills() != null) {
                for (String skill : profile.stackSkills()) {
                    if (!AVAILABLE_STACK.contains(skill)) {
                        errors.add("Неизвестный навык: " + skill + ".");
                    }
                }
            }
        } else if (profile.stackSkills() == null || profile.stackSkills().isEmpty()) {
            errors.add("Выберите хотя бы один навык из стека.");
        } else {
            for (String skill : profile.stackSkills()) {
                if (!AVAILABLE_STACK.contains(skill)) {
                    errors.add("Неизвестный навык: " + skill + ".");
                }
            }
            int maxStack = maxStackForExperience(profile.experienceYears());
            if (profile.stackSkills().size() > maxStack) {
                errors.add("При опыте " + profile.experienceYears() + " "
                        + yearWord(profile.experienceYears())
                        + " — максимум " + maxStack + " навыков в стеке.");
            }
        }

        if (!explorer && profile.experienceYears() >= 10 && profile.stackSkills() != null
                && profile.stackSkills().size() < 2) {
            errors.add("Senior-уровень: укажите минимум 2 навыка.");
        }

        if (!errors.isEmpty()) {
            return ValidationResult.fail(errors);
        }

        int stackBonus = profile.stackSkills() != null
                ? Math.min(profile.stackSkills().size() * 3, MAX_STACK_SKILLS * 3) : 0;
        int exp = profile.experienceYears();
        int java = explorer ? 5 : Math.min(15 + exp * 8 + stackBonus, 75);
        int soft = Math.min(10 + exp * 4, 60);
        int code = explorer ? 0 : Math.min(25 + exp * 6 + stackBonus, 70);
        int money = CompensationCalculator.startingBalance(profile.experienceYears(), profile.education());

        String title = explorer ? "Гость (знакомство с IT)" : careerTitle(exp);
        return new ValidationResult(true, List.of(), java, soft, code, money, title);
    }

    private static void validateEducation(CharacterProfile profile, List<String> errors) {
        validateEducation(profile, errors, null);
    }

    private static void validateEducation(CharacterProfile profile, List<String> errors,
                                          com.devsimulator.model.GameMode mode) {
        EducationLevel edu = profile.education();
        int age = profile.age();
        int exp = profile.experienceYears();

        boolean explorer = mode == com.devsimulator.model.GameMode.EXPLORER;

        if (!explorer) {
            if (age < edu.getMinAge()) {
                errors.add("Для «" + edu.getLabel() + "» минимальный возраст — " + edu.getMinAge() + ".");
            }
            if (age > edu.getMaxAge()) {
                errors.add("Для «" + edu.getLabel() + "» максимальный возраст — " + edu.getMaxAge() + ".");
            }
        }
        if (exp > edu.getMaxExp()) {
            errors.add("Для «" + edu.getLabel() + "» максимум " + edu.getMaxExp() + " лет опыта. "
                    + educationMaxExpHint(edu));
        }

        if (explorer) {
            return;
        }

        switch (edu) {
            case STUDENT -> {
                if (exp >= 3) {
                    errors.add("При " + exp + " годах опыта укажите «Высшее», Bootcamp или «Самоучка», не «Студент».");
                }
            }
            case SCHOOL -> {
                if (age >= 20 && exp > 0) {
                    errors.add("С опытом работы после 20 лет укажите студента, bootcamp или высшее.");
                }
            }
            case CAREER_CHANGE -> {
                if (age < 24) {
                    errors.add("Смена профессии в IT обычно с 24 лет и старше.");
                }
            }
            default -> { }
        }

        if (age <= 19 && exp > 1) {
            errors.add("В " + age + " лет обычно не больше 1 года коммерческого опыта.");
        }

        if (age < 23 && exp >= 5) {
            errors.add("5+ лет опыта к " + age + " годам — проверьте возраст и стаж.");
        }

        if (exp == 0 && age >= 28 && mode != com.devsimulator.model.GameMode.EXPLORER) {
            errors.add("В " + age + " лет на позицию разработчика обычно уже есть коммерческий опыт.");
        }
    }

    private static String educationMaxExpHint(EducationLevel edu) {
        return switch (edu) {
            case STUDENT -> "При 3+ годах опыта выберите «Высшее», Bootcamp или «Самоучка».";
            case SCHOOL -> "После 20 лет с опытом укажите студента, bootcamp или высшее.";
            default -> "Проверьте сочетание возраста и стажа.";
        };
    }

    public static int maxStackForExperience(int experienceYears) {
        if (experienceYears == 0) {
            return 3;
        }
        if (experienceYears <= 2) {
            return 5;
        }
        if (experienceYears <= 5) {
            return 7;
        }
        return MAX_STACK_SKILLS;
    }

    private static String yearWord(int years) {
        int mod10 = years % 10;
        int mod100 = years % 100;
        if (mod10 == 1 && mod100 != 11) {
            return "год";
        }
        if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
            return "года";
        }
        return "лет";
    }

    public static String careerTitle(int experienceYears) {
        return switch (CareerTier.fromExperience(experienceYears)) {
            case INTERN -> "Стажёр";
            case JUNIOR -> "Junior Developer";
            case MIDDLE -> "Middle Developer";
            case SENIOR -> "Senior Developer";
        };
    }

    /** Должность в команде проекта с учётом опыта (в каталоге зашит junior-шаблон). */
    public static String yourRoleFor(ProjectProfile profile, int experienceYears) {
        return yourRoleFor(profile.yourRole(), experienceYears);
    }

    public static String yourRoleFor(String baseRole, int experienceYears) {
        if (baseRole == null || baseRole.isBlank()) {
            return careerTitle(experienceYears);
        }
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        int split = baseRole.indexOf(" в ");
        String suffix = split >= 0 ? baseRole.substring(split) : "";
        boolean javaDev = baseRole.contains("Java Developer");

        String grade = switch (tier) {
            case INTERN -> "Стажёр";
            case JUNIOR -> "Junior";
            case MIDDLE -> "Middle";
            case SENIOR -> "Senior";
        };

        if (javaDev) {
            return grade + " Java Developer" + suffix;
        }
        if (baseRole.contains("Developer")) {
            return grade + " Developer" + suffix;
        }
        return grade + suffix;
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
