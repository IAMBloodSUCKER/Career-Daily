package com.devsimulator.api.dto;

import com.devsimulator.model.Player;

import java.util.List;

public record PlayerDto(
        String name,
        int age,
        int experienceYears,
        String education,
        List<String> stackSkills,
        String careerTitle,
        int level,
        int exp,
        int expToNextLevel,
        int money,
        int stress,
        int health,
        int energy,
        int javaSkill,
        int softSkills,
        int codeQuality,
        int colleagueRating,
        int day,
        int warnings,
        int consecutiveNoWorkDays,
        List<HrWarningDto> hrWarnings
) {
    public static PlayerDto from(Player p) {
        return new PlayerDto(
                p.getName(), p.getAge(), p.getExperienceYears(),
                p.getEducation() != null ? p.getEducation().getLabel() : "",
                p.getStackSkills(), p.getCareerTitle(),
                p.getLevel(), p.getExp(), p.getExpToNextLevel(),
                p.getMoney(), p.getStress(), p.getHealth(), p.getEnergy(),
                p.getJavaSkill(), p.getSoftSkills(), p.getCodeQuality(),
                p.getColleagueRating(), p.getDay(), p.getWarnings(), p.getConsecutiveNoWorkDays(),
                p.getHrWarnings().stream().map(HrWarningDto::from).toList()
        );
    }
}
