package com.devsimulator.service;

import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.TeamMemberIntro;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class TeamGenerator {

    private static final String[] LAST_INITIALS = {
            "А.", "Б.", "В.", "Г.", "Д.", "Е.", "Ж.", "З.", "И.", "К.", "Л.", "М.",
            "Н.", "О.", "П.", "Р.", "С.", "Т.", "У.", "Ф.", "Х.", "Ц.", "Ч.", "Ш.", "Щ.", "Ю.", "Я."
    };

    private static final String[] FEMALE_NAMES = {
            "Анна", "Мария", "Елена", "Ольга", "Дарья", "Наталья", "Виктория", "Татьяна",
            "Алина", "Ксения", "Полина", "София", "Юлия", "Вера", "Ирина", "Людмила"
    };

    private static final String[] MALE_NAMES = {
            "Алексей", "Дмитрий", "Игорь", "Максим", "Сергей", "Артём", "Никита", "Павел",
            "Роман", "Кирилл", "Егор", "Владимир", "Андрей", "Михаил", "Олег", "Станислав"
    };

    private static final Map<String, Boolean> FEMALE_ROLES = Map.of(
            "anna", true,
            "maria", true,
            "alex", false,
            "igor", false,
            "dmitry", false
    );

    private TeamGenerator() {
    }

    public static List<TeamMemberIntro> randomizeTeam(ProjectProfile template, Random random) {
        Map<String, TeamMemberIntro> byId = template.team().stream()
                .collect(Collectors.toMap(TeamMemberIntro::id, Function.identity(), (a, b) -> a, LinkedHashMap::new));
        int teamSize = 3 + random.nextInt(3);
        List<String> roleIds = selectRoles(teamSize, random);
        Set<String> usedNames = new HashSet<>();
        List<TeamMemberIntro> team = new ArrayList<>();
        for (String roleId : roleIds) {
            TeamMemberIntro source = byId.get(roleId);
            if (source == null) {
                continue;
            }
            team.add(new TeamMemberIntro(
                    source.id(),
                    randomName(roleId, random, usedNames),
                    source.role(),
                    source.avatar(),
                    source.bio(),
                    source.greeting()
            ));
        }
        return team;
    }

    public static ProjectProfile withTeam(ProjectProfile profile, List<TeamMemberIntro> team) {
        return new ProjectProfile(
                profile.type(),
                profile.companyName(),
                profile.productName(),
                profile.tagline(),
                profile.description(),
                profile.techStack(),
                profile.architecture(),
                profile.yourRole(),
                List.copyOf(team),
                profile.slackChannel(),
                profile.introSteps()
        );
    }

    public static boolean hasMember(ProjectProfile profile, String memberId) {
        return profile.team().stream().anyMatch(m -> memberId.equals(m.id()));
    }

    public static String facilitatorId(ProjectProfile profile) {
        if (hasMember(profile, "igor")) {
            return "igor";
        }
        if (hasMember(profile, "anna")) {
            return "anna";
        }
        return profile.team().isEmpty() ? "anna" : profile.team().get(0).id();
    }

    private static List<String> selectRoles(int size, Random random) {
        List<String> roles = new ArrayList<>(List.of("anna", "alex", "maria"));
        if (size >= 4) {
            roles.add(random.nextBoolean() ? "igor" : "dmitry");
        }
        if (size >= 5) {
            String extra = roles.contains("igor") ? "dmitry" : "igor";
            if (!roles.contains(extra)) {
                roles.add(extra);
            }
        }
        return roles;
    }

    private static String randomName(String roleId, Random random, Set<String> usedNames) {
        boolean female = FEMALE_ROLES.getOrDefault(roleId, random.nextBoolean());
        String[] pool = female ? FEMALE_NAMES : MALE_NAMES;
        for (int attempt = 0; attempt < 40; attempt++) {
            String first = pool[random.nextInt(pool.length)];
            String last = LAST_INITIALS[random.nextInt(LAST_INITIALS.length)];
            String full = first + " " + last;
            if (usedNames.add(full)) {
                return full;
            }
        }
        String fallback = pool[random.nextInt(pool.length)] + " " + (usedNames.size() + 1) + ".";
        usedNames.add(fallback);
        return fallback;
    }
}
