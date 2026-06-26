package com.devsimulator.model;

public enum TaskType {
    BUG_FIX("Исправить баг", "🐛", 50, 80, 25, 0, 5, 15),
    FEATURE("Новая фича", "✨", 70, 120, 35, 10, 8, 25),
    CODE_REVIEW("Код-ревью", "🔍", 30, 60, 15, 0, 3, 10),
    MEETING("Митинг", "📅", 10, 0, 30, 0, 0, 20),
    REFACTORING("Рефакторинг", "♻️", 40, 50, 10, 15, 10, 15),
    LEARNING("Изучить Java", "📚", 25, -30, 5, 20, 0, 10),
    PRODUCTION_BUG("Баг в проде!", "🚨", 80, 150, 50, 0, 15, 30);

    private final String title;
    private final String emoji;
    private final int expReward;
    private final int moneyReward;
    private final int stressCost;
    private final int javaSkillGain;
    private final int codeQualityGain;
    private final int energyCost;

    TaskType(String title, String emoji, int expReward, int moneyReward, int stressCost,
             int javaSkillGain, int codeQualityGain, int energyCost) {
        this.title = title;
        this.emoji = emoji;
        this.expReward = expReward;
        this.moneyReward = moneyReward;
        this.stressCost = stressCost;
        this.javaSkillGain = javaSkillGain;
        this.codeQualityGain = codeQualityGain;
        this.energyCost = energyCost;
    }

    public String getTitle() {
        return title;
    }

    public String getEmoji() {
        return emoji;
    }

    public int getExpReward() {
        return expReward;
    }

    public int getMoneyReward() {
        return moneyReward;
    }

    public int getStressCost() {
        return stressCost;
    }

    public int getJavaSkillGain() {
        return javaSkillGain;
    }

    public int getCodeQualityGain() {
        return codeQualityGain;
    }

    public int getEnergyCost() {
        return energyCost;
    }

    public String getDisplayText() {
        return emoji + " " + title;
    }
}
