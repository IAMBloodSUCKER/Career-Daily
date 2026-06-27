package com.devsimulator.service;

import com.devsimulator.model.CareerTier;
import com.devsimulator.model.EducationLevel;
import com.devsimulator.model.Player;
import com.devsimulator.model.TaskType;

/** Оценка компенсации для корпоративного портала и выплат (₽, gross). */
public final class CompensationCalculator {

    private static final int WORK_DAYS_PER_MONTH = 22;
    private static final int MAX_MONTHLY_GROSS = 950_000;

    private CompensationCalculator() {
    }

    /** Базовая дневная выплата при закрытии всех задач дня (~ gross / 22). */
    public static int dailyBase(Player player) {
        int monthly = monthlyGross(player);
        int daily = monthly / WORK_DAYS_PER_MONTH;
        int qualityBonus = player.getCodeQuality() / 20 * 500;
        return daily + qualityBonus;
    }

    /** Ориентир месячного gross по грейду, опыту и скиллам. */
    public static int monthlyGross(Player player) {
        CareerTier tier = CareerTier.fromExperience(player.getExperienceYears());
        int exp = player.getExperienceYears();
        int base = tierBaseMonthly(tier, exp);
        base += player.getLevel() * tierLevelBonus(tier);
        base += player.getJavaSkill() * skillRubPerPoint(exp);
        base += player.getCodeQuality() / 10 * 1_500;
        return Math.min(base, MAX_MONTHLY_GROSS);
    }

    public static int calculateDailyPayout(Player player, int completed, int unfinished) {
        if (completed == 0) {
            return 0;
        }
        return dailyBase(player) * completed / Math.max(1, completed + unfinished);
    }

    /** Сбережения на старте карьеры (до первой зарплаты). */
    public static int startingBalance(int experienceYears, EducationLevel education) {
        CareerTier tier = CareerTier.fromExperience(experienceYears);
        int base = switch (tier) {
            case INTERN -> 18_000;
            case JUNIOR -> 30_000 + experienceYears * 15_000;
            case MIDDLE -> 70_000 + experienceYears * 8_000;
            case SENIOR -> 110_000 + experienceYears * 12_000;
        };
        if (education == EducationLevel.UNIVERSITY) {
            base += 10_000;
        }
        return base;
    }

    /** Бонус к балансу при повышении уровня (~5% от месячного оклада). */
    public static int levelUpBonus(Player player) {
        return Math.max(5_000, monthlyGross(player) / 20);
    }

    /** Штраф за день без закрытых задач (≈ один рабочий день). */
    public static int noWorkDayPenalty(Player player) {
        return Math.max(3_000, dailyBase(player));
    }

    /** Разовый бонус за закрытие задачи (% от дневной ставки). */
    public static int taskCompletionBonus(Player player, TaskType type) {
        int daily = dailyBase(player);
        return switch (type) {
            case BUG_FIX -> daily * 12 / 100;
            case FEATURE -> daily * 18 / 100;
            case CODE_REVIEW -> daily * 8 / 100;
            case REFACTORING -> daily * 10 / 100;
            case LEARNING -> -daily * 15 / 100;
            case PRODUCTION_BUG -> daily * 25 / 100;
            case MEETING -> 0;
        };
    }

    public static String payGrade(Player player) {
        CareerTier tier = CareerTier.fromExperience(player.getExperienceYears());
        return tier.getLabel() + " · Level " + player.getLevel()
                + " · ~" + formatRubles(monthlyGross(player)) + "/мес";
    }

    public static String nextReviewLabel(int day) {
        int cycle = 30;
        int daysLeft = cycle - (day % cycle);
        if (daysLeft == 0) {
            daysLeft = cycle;
        }
        return "через " + daysLeft + " дн.";
    }

    public static String formatRubles(int amount) {
        return String.format("%,d", amount).replace(',', '\u00a0') + " ₽";
    }

    public static String formatSignedRubles(int amount) {
        String num = String.format("%,d", Math.abs(amount)).replace(',', '\u00a0');
        if (amount >= 0) {
            return "+" + num + " ₽";
        }
        return "−" + num + " ₽";
    }

    private static int tierBaseMonthly(CareerTier tier, int exp) {
        return switch (tier) {
            case INTERN -> 55_000;
            case JUNIOR -> 95_000 + exp * 32_000;
            case MIDDLE -> 195_000 + Math.max(0, exp - 3) * 38_000;
            case SENIOR -> 340_000 + Math.max(0, exp - 6) * 42_000;
        };
    }

    private static int tierLevelBonus(CareerTier tier) {
        return switch (tier) {
            case INTERN -> 2_500;
            case JUNIOR -> 4_000;
            case MIDDLE -> 6_500;
            case SENIOR -> 9_000;
        };
    }

    private static int skillRubPerPoint(int exp) {
        if (exp == 0) {
            return 200;
        }
        if (exp <= 2) {
            return 350;
        }
        if (exp <= 5) {
            return 450;
        }
        return 550;
    }
}
