package com.devsimulator.model;

public enum GameMode {
    EXPLORER("Знакомство", "Без кода: процесс, люди и инструменты", 0.0, true),
    LEARNING("Учебный", "Подсказки, без штрафов за стресс", 0.0, true),
    RELAXED("Спокойный", "Только техника, минимум стресса", 0.3, false),
    REALISTIC("Реалистичный", "Случайные события и прод-баги", 1.0, false),
    CHALLENGE("Челлендж", "Дедлайны, переработки, хаос", 1.8, false);

    private final String displayName;
    private final String description;
    private final double stressMultiplier;
    private final boolean hintsEnabled;

    GameMode(String displayName, String description, double stressMultiplier, boolean hintsEnabled) {
        this.displayName = displayName;
        this.description = description;
        this.stressMultiplier = stressMultiplier;
        this.hintsEnabled = hintsEnabled;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getDescription() {
        return description;
    }

    public double getStressMultiplier() {
        return stressMultiplier;
    }

    public boolean isHintsEnabled() {
        return hintsEnabled;
    }

    /** Режим без написания кода — только коммуникации и знакомство с процессом. */
    public boolean isNoCode() {
        return this == EXPLORER;
    }

    /** Мягкая HR-политика (испытательный срок, меньше штрафов). */
    public boolean isSoftHr() {
        return this == LEARNING || this == EXPLORER;
    }
}
