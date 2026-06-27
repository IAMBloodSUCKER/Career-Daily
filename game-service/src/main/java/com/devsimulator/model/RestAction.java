package com.devsimulator.model;

public enum RestAction {
    COFFEE("☕ Кофе", "Бодрит, но повышает стресс", 10, 0, 0, 20, 1),
    GYM("🏋️ Спортзал", "−стресс, +здоровье · 2ч игрового времени · лучше днём после задач", -25, 10, 0, -20, 2),
    FRIENDS("🎉 Друзья", "−стресс, отдых · 3ч · только вечером после закрытых задач", -15, 0, 5, -10, 3),
    SLEEP("😴 Сон", "Восстанавливает энергию", -10, 20, 0, 40, 8),
    MENTOR("👨‍🏫 Ментор", "Совет от senior-разработчика", -10, 15, 30, -5, 1);

    private final String title;
    private final String description;
    private final int stressChange;
    private final int healthChange;
    private final int expGain;
    private final int energyChange;
    private final int durationHours;

    RestAction(String title, String description, int stressChange, int healthChange,
               int expGain, int energyChange, int durationHours) {
        this.title = title;
        this.description = description;
        this.stressChange = stressChange;
        this.healthChange = healthChange;
        this.expGain = expGain;
        this.energyChange = energyChange;
        this.durationHours = durationHours;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public int getStressChange() {
        return stressChange;
    }

    public int getHealthChange() {
        return healthChange;
    }

    public int getExpGain() {
        return expGain;
    }

    public int getEnergyChange() {
        return energyChange;
    }

    public int getDurationHours() {
        return durationHours;
    }

    public int getAnimationDurationMs() {
        return durationHours * 1200 + 1500;
    }
}
