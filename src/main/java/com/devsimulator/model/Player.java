package com.devsimulator.model;

import com.devsimulator.service.CharacterValidator;

import java.util.ArrayList;
import java.util.List;

public class Player {
    private String name;
    private int age;
    private int experienceYears;
    private EducationLevel education;
    private List<String> stackSkills;
    private String careerTitle;
    private int level;
    private int exp;
    private int money;
    private int stress;
    private int health;
    private int energy;
    private int javaSkill;
    private int softSkills;
    private int codeQuality;
    private int day;
    private int colleagueRating;
    private int warnings;
    private int consecutiveNoWorkDays;
    private final java.util.List<HrWarning> hrWarnings = new ArrayList<>();

    public Player(CharacterValidator.PlayerStats stats) {
        this.name = stats.name();
        this.age = stats.age();
        this.experienceYears = stats.experienceYears();
        this.education = stats.education();
        this.stackSkills = new ArrayList<>(stats.stackSkills());
        this.careerTitle = stats.careerTitle();
        this.level = Math.max(1, 1 + stats.experienceYears() / 4);
        this.exp = 0;
        this.money = stats.startingMoney();
        this.stress = 10;
        this.health = 100;
        this.energy = 100;
        this.javaSkill = stats.javaSkill();
        this.softSkills = stats.softSkills();
        this.codeQuality = stats.codeQuality();
        this.day = 1;
        this.colleagueRating = 5;
        this.warnings = 0;
        this.consecutiveNoWorkDays = 0;
    }

    public String getName() {
        return name;
    }

    public int getAge() {
        return age;
    }

    public int getExperienceYears() {
        return experienceYears;
    }

    public EducationLevel getEducation() {
        return education;
    }

    public List<String> getStackSkills() {
        return stackSkills;
    }

    public String getCareerTitle() {
        return careerTitle;
    }

    public int getLevel() {
        return level;
    }

    public int getExp() {
        return exp;
    }

    public int getExpToNextLevel() {
        return level * 100;
    }

    public int getMoney() {
        return money;
    }

    public int getStress() {
        return stress;
    }

    public int getHealth() {
        return health;
    }

    public int getEnergy() {
        return energy;
    }

    public int getJavaSkill() {
        return javaSkill;
    }

    public int getSoftSkills() {
        return softSkills;
    }

    public int getCodeQuality() {
        return codeQuality;
    }

    public int getDay() {
        return day;
    }

    public int getColleagueRating() {
        return colleagueRating;
    }

    public int getWarnings() {
        return warnings;
    }

    public int getConsecutiveNoWorkDays() {
        return consecutiveNoWorkDays;
    }

    public java.util.List<HrWarning> getHrWarnings() {
        return hrWarnings;
    }

    public void addWarning() {
        addWarning("Нарушение трудовой дисциплины");
    }

    public void addWarning(String reason) {
        warnings++;
        hrWarnings.add(new HrWarning(day, reason != null && !reason.isBlank()
                ? reason
                : "Нарушение трудовой дисциплины"));
    }

    public void resetConsecutiveNoWorkDays() {
        consecutiveNoWorkDays = 0;
    }

    public void incrementConsecutiveNoWorkDays() {
        consecutiveNoWorkDays++;
    }

    public boolean isFired() {
        return warnings >= GameBalance.FIRED_WARNINGS_THRESHOLD
                && colleagueRating <= GameBalance.FIRED_RATING_THRESHOLD;
    }

    public void addExp(int amount) {
        exp += amount;
        while (exp >= getExpToNextLevel()) {
            levelUp();
        }
    }

    public void addMoney(int amount) {
        money = Math.max(0, money + amount);
    }

    public void addStress(int amount) {
        stress = clamp(stress + amount, 0, 100);
    }

    public void addHealth(int amount) {
        health = clamp(health + amount, 0, 100);
    }

    public void addEnergy(int amount) {
        energy = clamp(energy + amount, 0, 100);
    }

    public void addJavaSkill(int amount) {
        javaSkill = clamp(javaSkill + amount, 0, 100);
    }

    public void addSoftSkills(int amount) {
        softSkills = clamp(softSkills + amount, 0, 100);
    }

    public void addCodeQuality(int amount) {
        codeQuality = clamp(codeQuality + amount, 0, 100);
    }

    public void addColleagueRating(int amount) {
        colleagueRating = clamp(colleagueRating + amount, 1, 10);
    }

    public void nextDay() {
        day++;
        energy = clamp(energy + 30, 0, 100);
        addStress(-5);
    }

    public boolean isBurnedOut() {
        return stress >= 100 || health <= 0;
    }

    private void levelUp() {
        exp -= getExpToNextLevel();
        level++;
        javaSkill += 5;
        softSkills += 3;
        money += 200;
    }

    public static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    public static Player fromSnapshot(com.devsimulator.persistence.snapshot.GameEngineSnapshot.PlayerSnapshot s) {
        Player player = new Player();
        player.name = s.name();
        player.age = s.age();
        player.experienceYears = s.experienceYears();
        player.education = com.devsimulator.model.EducationLevel.valueOf(s.education());
        player.stackSkills = new ArrayList<>(s.stackSkills());
        player.careerTitle = s.careerTitle();
        player.level = s.level();
        player.exp = s.exp();
        player.money = s.money();
        player.stress = s.stress();
        player.health = s.health();
        player.energy = s.energy();
        player.javaSkill = s.javaSkill();
        player.softSkills = s.softSkills();
        player.codeQuality = s.codeQuality();
        player.day = s.day();
        player.colleagueRating = s.colleagueRating();
        player.warnings = s.warnings();
        player.consecutiveNoWorkDays = s.consecutiveNoWorkDays();
        player.hrWarnings.clear();
        if (s.hrWarnings() != null) {
            for (var w : s.hrWarnings()) {
                player.hrWarnings.add(new HrWarning(w.day(), w.reason()));
            }
        }
        return player;
    }

    private Player() {
    }
}
