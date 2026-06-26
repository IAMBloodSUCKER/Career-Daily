package com.devsimulator.model;

/** Баланс: длина дня, испытательный срок, пороги HR. */
public final class GameBalance {

    /** Игровой «рабочий день» на часах DevOS (09:00–17:00). */
    public static final int WORK_DAY_HOURS = 8;
    public static final int DAY_START_HOUR = 9;
    public static final int DAY_END_HOUR = 17;

    /** 1 игровой день = 1 реальный час. */
    public static final long REAL_DAY_DURATION_MS = 60L * 60L * 1000L;

    /** Минимум игровых дней до победы (неделя) — во всех режимах. */
    public static final int MIN_GAME_DAYS = 7;

    /** Увольнение невозможно до этого игрового дня (испытательный срок). */
    public static final int MIN_DAY_BEFORE_TERMINATION = 4;

    public static final int FIRED_WARNINGS_THRESHOLD = 4;
    public static final int FIRED_RATING_THRESHOLD = 2;

    public static final int MAX_WARNINGS_LEARNING = 6;
    public static final int MAX_WARNINGS_DEFAULT = 5;

    public static final int CONSECUTIVE_NO_WORK_LEARNING = 4;
    public static final int CONSECUTIVE_NO_WORK_DEFAULT = 3;

    public static final int MAX_WARNINGS_PER_DAY_LEARNING = 1;

    private GameBalance() {
    }
}
