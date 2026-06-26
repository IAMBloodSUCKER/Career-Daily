package com.devsimulator.model;

public enum EducationLevel {
    SCHOOL("Школа / колледж", 16, 19, 0, 1),
    STUDENT("Студент (CS)", 18, 26, 0, 2),
    BOOTCAMP("Bootcamp", 18, 45, 0, 3),
    SELF_TAUGHT("Самоучка", 18, 55, 0, 15),
    UNIVERSITY("Высшее (CS/IT)", 20, 35, 0, 5),
    CAREER_CHANGE("Смена профессии", 25, 55, 0, 3);

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
