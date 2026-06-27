package com.devsimulator.api.dto;

import com.devsimulator.model.GameBalance;
import com.devsimulator.service.CharacterValidator;
import com.devsimulator.service.CompensationCalculator;
import com.devsimulator.service.InteractiveGameEngine;
import com.devsimulator.service.OfficeCalendarService;

import java.util.List;

public record WorkspaceDto(
        PlayerDto player,
        String mode,
        String modeId,
        boolean noCodeMode,
        String projectCompany,
        String projectProduct,
        String projectType,
        String projectEmoji,
        String projectTagline,
        String projectDescription,
        String architecture,
        List<String> techStack,
        String slackChannel,
        String yourRole,
        List<TeamMemberDto> team,
        int estimatedDailyPay,
        int estimatedMonthlyGross,
        String payGrade,
        String nextSalaryReview,
        String timeLabel,
        int hoursRemaining,
        long dayStartedAtEpochMs,
        long realDayDurationMs,
        long realTimeRemainingMs,
        int minGameDays,
        boolean dayEnded,
        boolean gameOver,
        String gameOverReason,
        String focusedTaskId,
        boolean atDesk,
        int lateMinutes,
        MeetingDto pendingMeeting,
        boolean meetingMissedToday,
        List<InteractiveTaskDto> tasks,
        List<ContactDto> contacts,
        List<MessageDto> messages,
        List<EmailDto> emails,
        List<CalendarEventDto> calendarEvents,
        List<String> console,
        List<RestActionDto> restActions,
        int wallpaperIndex,
        String pendingWorkloadContactId
) {
    public static WorkspaceDto from(InteractiveGameEngine engine) {
        engine.tickDayEvents();
        String focused = engine.getFocusedTaskId();
        var profile = engine.getProjectProfile();
        var player = engine.getPlayer();
        return new WorkspaceDto(
                PlayerDto.from(player),
                engine.getMode().getDisplayName(),
                engine.getMode().name(),
                engine.isNoCodeMode(),
                profile.companyName(),
                profile.productName(),
                profile.type().name(),
                profile.type().getEmoji(),
                profile.tagline(),
                profile.description(),
                profile.architecture(),
                profile.techStack(),
                profile.slackChannel(),
                CharacterValidator.yourRoleFor(profile, player.getExperienceYears()),
                profile.team().stream().map(TeamMemberDto::from).toList(),
                CompensationCalculator.dailyBase(player),
                CompensationCalculator.monthlyGross(player),
                CompensationCalculator.payGrade(player),
                CompensationCalculator.nextReviewLabel(player.getDay()),
                engine.getTimeLabel(),
                engine.getHoursRemaining(),
                engine.getDayStartedAtMillis(),
                GameBalance.REAL_DAY_DURATION_MS,
                engine.getRealTimeRemainingMs(),
                GameBalance.MIN_GAME_DAYS,
                engine.isDayEnded(),
                engine.isGameOver(),
                engine.getGameOverReason(),
                focused,
                engine.isAtDesk(),
                engine.getLateMinutes(),
                engine.getPendingMeeting(),
                engine.isMeetingMissedToday(),
                engine.getAllTasks().stream()
                        .map(t -> InteractiveTaskDto.from(t, focused, engine.getEditorCode(t.getId())))
                        .toList(),
                engine.getContacts().stream()
                        .map(c -> ContactDto.from(c, countUnread(engine, c.id())))
                        .toList(),
                engine.getMessages().stream().map(MessageDto::from).toList(),
                engine.getEmails().stream().map(EmailDto::from).toList(),
                OfficeCalendarService.build(engine),
                engine.getConsoleOutput(),
                RestActionDto.all(),
                engine.getWallpaperIndex(),
                engine.getPendingWorkloadContactId()
        );
    }

    private static int countUnread(InteractiveGameEngine engine, String contactId) {
        return (int) engine.getMessages().stream()
                .filter(m -> contactId.equals(m.getContactId()) && !m.isFromPlayer() && !m.isRead())
                .count();
    }
}
