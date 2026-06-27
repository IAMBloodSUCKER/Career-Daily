package com.devsimulator.model;

/**
 * Уровень карьеры — от него зависит, сколько задач и инцидентов в день.
 */
public enum CareerTier {
    INTERN("Стажёр", 0),
    JUNIOR("Junior", 1),
    MIDDLE("Middle", 3),
    SENIOR("Senior", 6);

    private final String label;
    private final int minExperienceYears;

    CareerTier(String label, int minExperienceYears) {
        this.label = label;
        this.minExperienceYears = minExperienceYears;
    }

    public String getLabel() {
        return label;
    }

    public static CareerTier fromExperience(int experienceYears) {
        if (experienceYears <= 0) {
            return INTERN;
        }
        if (experienceYears <= 2) {
            return JUNIOR;
        }
        if (experienceYears <= 5) {
            return MIDDLE;
        }
        return SENIOR;
    }

    /** С какого дня добавлять feature-задачу (недельный темп во всех режимах). */
    public int featureTaskFromDay(GameMode mode) {
        int base = switch (this) {
            case INTERN -> 4;
            case JUNIOR -> 5;
            case MIDDLE -> 4;
            case SENIOR -> 3;
        };
        return mode == GameMode.CHALLENGE ? Math.max(2, base - 1) : base;
    }

    /** С какого дня — observability / profiling. */
    public int observabilityFromDay(GameMode mode) {
        int base = switch (this) {
            case INTERN -> 6;
            case JUNIOR -> 6;
            case MIDDLE -> 5;
            case SENIOR -> 4;
        };
        return mode == GameMode.CHALLENGE ? Math.max(3, base - 1) : base;
    }

    /** С какого дня — code review чужого PR. */
    public int codeReviewFromDay(GameMode mode) {
        if (mode == GameMode.CHALLENGE && (this == MIDDLE || this == SENIOR)) {
            return 1;
        }
        return 2;
    }

    /** С какого дня — PR с собеседования. */
    public int interviewReviewFromDay(GameMode mode) {
        int base = switch (this) {
            case INTERN -> 5;
            case JUNIOR -> 4;
            case MIDDLE, SENIOR -> 3;
        };
        return mode == GameMode.CHALLENGE ? Math.max(2, base - 1) : base;
    }

    /** INC-501 в REALISTIC / CHALLENGE (в учебном режиме не используется). */
    public int inc501FromDay(GameMode mode) {
        if (mode == GameMode.LEARNING || mode == GameMode.RELAXED) {
            return 99;
        }
        return switch (this) {
            case INTERN -> mode == GameMode.CHALLENGE ? 5 : 6;
            case JUNIOR -> mode == GameMode.CHALLENGE ? 4 : 5;
            case MIDDLE, SENIOR -> mode == GameMode.CHALLENGE ? 2 : 3;
        };
    }

    public int inc502FromDay(GameMode mode) {
        if (mode == GameMode.LEARNING || mode == GameMode.RELAXED) {
            return 99;
        }
        return switch (this) {
            case INTERN -> 99;
            case JUNIOR -> mode == GameMode.CHALLENGE ? 5 : 6;
            case MIDDLE, SENIOR -> mode == GameMode.CHALLENGE ? 3 : 4;
        };
    }

    public int kafkaFromDay(GameMode mode) {
        if (mode == GameMode.LEARNING || mode == GameMode.RELAXED) {
            return 99;
        }
        return switch (this) {
            case INTERN -> 99;
            case JUNIOR -> mode == GameMode.CHALLENGE ? 6 : 7;
            case MIDDLE, SENIOR -> mode == GameMode.CHALLENGE ? 4 : 5;
        };
    }

    /** SQL-аналитика (departments, GROUP BY) — раньше чем slow-query расследования. */
    public int sqlAnalyticsFromDay(GameMode mode) {
        int base = switch (this) {
            case INTERN -> 5;
            case JUNIOR -> 2;
            case MIDDLE -> 1;
            case SENIOR -> 1;
        };
        return mode == GameMode.CHALLENGE ? Math.max(1, base - 1) : base;
    }

    /** Глубокий траблшутинг (OOM, импорт, latency). */
    public int troubleshootFromDay(GameMode mode) {
        if (mode == GameMode.RELAXED) {
            return 99;
        }
        if (mode == GameMode.LEARNING) {
            return 5;
        }
        return switch (this) {
            case INTERN -> 99;
            case JUNIOR -> mode == GameMode.CHALLENGE ? 2 : 3;
            case MIDDLE -> mode == GameMode.CHALLENGE ? 1 : 2;
            case SENIOR -> 1;
        };
    }

    /** Релиз / deploy pipeline. */
    public int releaseFromDay(GameMode mode) {
        if (mode == GameMode.LEARNING || mode == GameMode.RELAXED) {
            return 99;
        }
        return switch (this) {
            case INTERN, JUNIOR -> 99;
            case MIDDLE -> mode == GameMode.CHALLENGE ? 4 : 5;
            case SENIOR -> mode == GameMode.CHALLENGE ? 2 : 3;
        };
    }

    /** Java quiz / алгоритмы без IDE. */
    public int theoryQuizFromDay(GameMode mode) {
        return switch (this) {
            case INTERN -> 2;
            case JUNIOR -> 1;
            case MIDDLE, SENIOR -> 1;
        };
    }

    /** Через сколько мс простоя (все рабочие задачи закрыты) тимлид спрашивает про загрузку. */
    public long idleWorkloadCheckDelayMs() {
        return switch (this) {
            case INTERN -> 8 * 60_000L;
            case JUNIOR -> 6 * 60_000L;
            case MIDDLE -> 5 * 60_000L;
            case SENIOR -> 4 * 60_000L;
        };
    }

    /** Минимальный интервал между подкинутыми задачами в течение дня. */
    public long bonusTaskIntervalMs() {
        return switch (this) {
            case INTERN -> 25 * 60_000L;
            case JUNIOR -> 18 * 60_000L;
            case MIDDLE -> 14 * 60_000L;
            case SENIOR -> 10 * 60_000L;
        };
    }

    /** Сколько дополнительных задач можно выдать за один рабочий день. */
    public int maxBonusTasksPerDay() {
        return switch (this) {
            case INTERN -> 1;
            case JUNIOR -> 2;
            case MIDDLE -> 3;
            case SENIOR -> 4;
        };
    }

    @Deprecated
    public int featureTaskFromDay() {
        return featureTaskFromDay(GameMode.REALISTIC);
    }

    @Deprecated
    public int observabilityFromDay() {
        return observabilityFromDay(GameMode.REALISTIC);
    }

    /** @deprecated используйте {@link #codeReviewFromDay(GameMode)} */
    @Deprecated
    public boolean includesCodeReviewOnDay(int day) {
        return day >= codeReviewFromDay(GameMode.REALISTIC);
    }

    /** @deprecated используйте {@link #interviewReviewFromDay(GameMode)} */
    @Deprecated
    public boolean includesInterviewReviewOnDay(int day) {
        return day >= interviewReviewFromDay(GameMode.REALISTIC);
    }
}
