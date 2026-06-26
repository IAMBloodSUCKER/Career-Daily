package com.devsimulator.service;

import com.devsimulator.model.CareerTier;
import com.devsimulator.model.Player;

/** Оценка компенсации для корпоративного портала (игровые $). */
public final class CompensationCalculator {

    private CompensationCalculator() {
    }

    /** Базовая дневная выплата при закрытии всех задач дня. */
    public static int dailyBase(Player player) {
        return 50 + player.getLevel() * 30 + player.getCodeQuality() / 5;
    }

    /** Ориентир месячного gross (22 рабочих дня + бонус за скиллы). */
    public static int monthlyGross(Player player) {
        CareerTier tier = CareerTier.fromExperience(player.getExperienceYears());
        int band = switch (tier) {
            case INTERN -> 1_500;
            case JUNIOR -> 2_800;
            case MIDDLE -> 4_800;
            case SENIOR -> 7_200;
        };
        return band + player.getLevel() * 120 + player.getJavaSkill() * 8;
    }

    public static String payGrade(Player player) {
        CareerTier tier = CareerTier.fromExperience(player.getExperienceYears());
        return tier.getLabel() + " · Level " + player.getLevel();
    }

    public static String nextReviewLabel(int day) {
        int cycle = 30;
        int daysLeft = cycle - (day % cycle);
        if (daysLeft == 0) {
            daysLeft = cycle;
        }
        return "через " + daysLeft + " дн.";
    }
}
