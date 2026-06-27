package com.devsimulator.model;

public enum EducationLevel {
    SCHOOL("Школа / колледж", 16, 20, 0, 1),
    STUDENT("Студент (информатика)", 17, 65, 0, 2),
    BOOTCAMP("Bootcamp", 18, 65, 0, 40),
    SELF_TAUGHT("Самоучка", 18, 65, 0, 40),
    UNIVERSITY("Высшее (информатика / IT)", 22, 65, 0, 40),
    CAREER_CHANGE("Смена профессии", 24, 65, 0, 40);

    private final String label;
    private final int minAge;
    private final int maxAge;
    private final int minExp;
    private final int maxExp;

    EducationLevel(String label, int minAge, int maxAge, int minExp, int maxExp) {
        this.label = label;
        this.minAge = minAge;
        this.maxAge = maxAge;
        this.minExp = minExp;
        this.maxExp = maxExp;
    }

    public String getLabel() {
        return label;
    }

    public int getMinAge() {
        return minAge;
    }

    public int getMaxAge() {
        return maxAge;
    }

    public int getMinExp() {
        return minExp;
    }

    public int getMaxExp() {
        return maxExp;
    }
}
