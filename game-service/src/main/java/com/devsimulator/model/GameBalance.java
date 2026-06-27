package com.devsimulator.model;

/** Баланс: длина дня, испытательный срок, пороги HR. */
public final class GameBalance {

    /** Игровой «рабочий день» на часах DevOS (09:00–17:00). */
    public static final int WORK_DAY_HOURS = 8;
    public static final int DAY_START_HOUR = 9;
    public static final int DAY_END_HOUR = 17;

    /** Первый daily — не в 09:00, а позже, чтобы успеть осмотреться и взять задачи. */
    public static final int STANDUP_START_HOUR = 11;
    public static final int STANDUP_START_MINUTE = 30;
    public static final int STANDUP_DURATION_MINUTES = 15;
    public static final int STANDUP_REMINDER_LEAD_MINUTES = 15;

    public static int standupStartMinutes() {
        return STANDUP_START_HOUR * 60 + STANDUP_START_MINUTE;
    }

    public static int standupEndMinutes() {
        return standupStartMinutes() + STANDUP_DURATION_MINUTES;
    }

    public static String standupStartTimeLabel() {
        return String.format("%02d:%02d", STANDUP_START_HOUR, STANDUP_START_MINUTE);
    }

    public static String standupEndTimeLabel() {
        int end = standupEndMinutes();
        return String.format("%02d:%02d", end / 60, end % 60);
    }

    /** Sprint Sync — после daily. */
    public static final int SPRINT_SYNC_START_HOUR = 12;
    public static final int SPRINT_SYNC_START_MINUTE = 0;
    public static final int SPRINT_SYNC_DURATION_MINUTES = 30;

    public static int sprintSyncStartMinutes() {
        return SPRINT_SYNC_START_HOUR * 60 + SPRINT_SYNC_START_MINUTE;
    }

    public static int sprintSyncEndMinutes() {
        return sprintSyncStartMinutes() + SPRINT_SYNC_DURATION_MINUTES;
    }

    public static String sprintSyncStartTimeLabel() {
        return String.format("%02d:%02d", SPRINT_SYNC_START_HOUR, SPRINT_SYNC_START_MINUTE);
    }

    public static String sprintSyncEndTimeLabel() {
        int end = sprintSyncEndMinutes();
        return String.format("%02d:%02d", end / 60, end % 60);
    }

    /** Минуты игрового времени до начала daily (от 09:00 — отрицательно, если уже идёт). */
    public static int minutesUntilStandup(int currentHour, int currentMinute) {
        return standupStartMinutes() - (currentHour * 60 + currentMinute);
    }

    /** Текст «Daily через …» / «Daily в HH:MM» для Slack — только игровые часы. */
    public static String standupTimingPhrase(int currentHour, int currentMinute) {
        int until = minutesUntilStandup(currentHour, currentMinute);
        String at = standupStartTimeLabel();
        if (until <= 0) {
            return "Daily уже начался (в " + at + ").";
        }
        if (until < 60) {
            return "Daily через " + until + " мин (в " + at + ").";
        }
        int h = until / 60;
        int m = until % 60;
        if (m == 0) {
            return "Daily через " + h + " ч (в " + at + ").";
        }
        return "Daily через " + h + " ч " + m + " мин (в " + at + ").";
    }

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
