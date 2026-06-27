package com.devsimulator.service;

import com.devsimulator.api.dto.MeetingDto;
import com.devsimulator.api.dto.MeetingLineDto;
import com.devsimulator.api.dto.MeetingOptionDto;
import com.devsimulator.model.InteractiveTask;
import com.devsimulator.model.Player;
import com.devsimulator.model.ProjectProfile;
import com.devsimulator.model.TeamMemberIntro;

import java.util.ArrayList;
import java.util.List;

public final class MeetingLibrary {

    private MeetingLibrary() {
    }

    public static MeetingDto dailyStandup(Player player, ProjectProfile profile,
                                         List<InteractiveTask> tasks, boolean missedDueToLate) {
        if (missedDueToLate) {
            return null;
        }
        String playerName = player.getName().split("\\s+")[0];
        String mention = ScenarioLibrary.mention(player.getName());
        List<MeetingLineDto> lines = new ArrayList<>();

        addLineIfPresent(lines, profile, "igor",
                "Доброе утро! Daily в " + profile.slackChannel() + ". Быстро по статусу — у всех плотный день.");
        addLineIfPresent(lines, profile, "anna",
                "Привет всем. " + mention + " — welcome aboard. "
                        + player.getCareerTitle() + ", первый день — не стесняйся задавать вопросы.");
        addLineIfPresent(lines, profile, "alex",
                "У меня PR #247 на ревью. " + playerName + ", если будет время — глянь PaymentGateway.");
        addLineIfPresent(lines, profile, "maria",
                "JIRA-142 блокирует релиз. NPE в OrderService — нужен hotfix сегодня.");
        lines.add(playerLine(player, tasks));
        addLineIfPresent(lines, profile, "dmitry",
                "Prod стабилен. PagerDuty quiet. Если деплоите — пишите в #war-room.");
        addLineIfPresent(lines, profile, "igor",
                "Ок, разбегаемся. " + playerName + " — начни с JIRA-142 и Slack. Daily завершён.");
        if (lines.size() <= 1) {
            lines.add(0, line(profile, TeamGenerator.facilitatorId(profile),
                    "Короткий daily. " + playerName + ", начни с задач в Slack."));
        }

        return new MeetingDto(
                "daily-standup-day-" + player.getDay(),
                "📹 Daily Standup",
                profile.companyName() + " · " + profile.slackChannel(),
                lines,
                false,
                false
        );
    }

    public static MeetingDto sprintSync(Player player, ProjectProfile profile, List<InteractiveTask> tasks) {
        int open = (int) tasks.stream().filter(t -> !t.isCompleted()).count();
        List<MeetingLineDto> lines = new ArrayList<>();
        addLineIfPresent(lines, profile, "igor",
                "Короткий sync по спринту. Открытых задач: " + open + ". Дедлайн — сегодня EOD.");
        addLineIfPresent(lines, profile, "anna",
                "Фокус на checkout. Без закрытых багов релиз не едем.");
        lines.add(new MeetingLineDto(
                "player", player.getName(), "🧑‍💻", player.getCareerTitle(),
                "", true,
                List.of(
                        new MeetingOptionDto("sync-ok", "Понял, JIRA-142 в приоритете. К обеду дам статус."),
                        new MeetingOptionDto("sync-blocked", "Есть блокер — нужна помощь с OrderService."),
                        new MeetingOptionDto("sync-late", "Могу не успеть, нужно +2 часа.")
                )
        ));
        addLineIfPresent(lines, profile, "igor",
                "Принято. Вопросы — в Slack. Sync окончен.");
        return new MeetingDto(
                "sprint-sync-day-" + player.getDay(),
                "📅 Sprint Sync",
                profile.productName(),
                lines,
                false,
                false
        );
    }

    private static void addLineIfPresent(List<MeetingLineDto> lines, ProjectProfile profile,
                                         String memberId, String text) {
        if (TeamGenerator.hasMember(profile, memberId)) {
            lines.add(line(profile, memberId, text));
        }
    }

    private static MeetingLineDto line(ProjectProfile profile, String memberId, String text) {
        TeamMemberIntro member = profile.team().stream()
                .filter(t -> t.id().equals(memberId))
                .findFirst()
                .orElse(profile.team().get(0));
        return new MeetingLineDto(member.id(), member.name(), member.avatar(), member.role(), text, false, List.of());
    }

    private static MeetingLineDto playerLine(Player player, List<InteractiveTask> tasks) {
        String firstTask = tasks.stream()
                .filter(t -> !t.isCompleted())
                .map(t -> t.getTicketId())
                .findFirst()
                .orElse("backlog");
        return new MeetingLineDto(
                "player", player.getName(), "🧑‍💻", player.getCareerTitle(),
                "", true,
                List.of(
                        new MeetingOptionDto("standup-new",
                                "Вчера onboarding, сегодня беру " + firstTask + " в работу."),
                        new MeetingOptionDto("standup-progress",
                                "Разбираюсь с окружением, к обеду начну " + firstTask + "."),
                        new MeetingOptionDto("standup-blocked",
                                "Пока нет доступов, нужна помощь с настройкой.")
                )
        );
    }
}
