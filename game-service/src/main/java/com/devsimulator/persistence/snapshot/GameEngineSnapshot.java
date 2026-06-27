package com.devsimulator.persistence.snapshot;

import com.devsimulator.api.dto.MeetingDto;
import com.devsimulator.model.CodeChallenge;
import com.devsimulator.model.ReplyOption;

import java.util.List;
import java.util.Map;

public record GameEngineSnapshot(
        PlayerSnapshot player,
        String mode,
        String projectType,
        DayRecordSnapshot dayRecord,
        List<TaskSnapshot> dailyTasks,
        List<MessageSnapshot> messages,
        List<EmailSnapshot> emails,
        Map<String, String> editorCode,
        List<String> consoleOutput,
        String focusedTaskId,
        String lastMessage,
        boolean gameOver,
        String gameOverReason,
        int hoursRemaining,
        int currentHour,
        int currentMinute,
        long dayStartedAtMillis,
        boolean dayEnded,
        boolean atDesk,
        int lateMinutes,
        MeetingDto pendingMeeting,
        MeetingDto queuedMeeting,
        MeetingDto scheduledDailyStandup,
        boolean meetingMissedToday,
        List<TeamMemberSnapshot> team,
        int wallpaperIndex,
        String pendingWorkloadContactId,
        long lastBonusInjectionMs,
        int bonusTasksInjectedToday,
        long workIdleSinceMs,
        boolean sprintSyncAttendedToday
) {
    public record PlayerSnapshot(
            String name,
            int age,
            int experienceYears,
            String education,
            List<String> stackSkills,
            String careerTitle,
            int level,
            int exp,
            int money,
            int stress,
            int health,
            int energy,
            int javaSkill,
            int softSkills,
            int codeQuality,
            int day,
            int colleagueRating,
            int warnings,
            int consecutiveNoWorkDays,
            List<HrWarningSnapshot> hrWarnings
    ) {
    }

    public record HrWarningSnapshot(int day, String reason) {
    }

    public record DayRecordSnapshot(
            int tasksCompleted,
            int tasksSkipped,
            int restActions,
            int leisureActions,
            int workHoursSpent
    ) {
    }

    public record TaskSnapshot(
            String id,
            String ticketId,
            String title,
            String description,
            String type,
            int durationHours,
            List<ObjectiveSnapshot> objectives,
            CodeChallenge codeChallenge,
            List<ReplyOption> replyOptions,
            String jiraStatus,
            boolean testsPassed,
            boolean completed,
            Integer pullRequestNumber,
            String pullRequestStatus,
            String reviewerContactId,
            String scenarioTag
    ) {
    }

    public record ObjectiveSnapshot(
            String id,
            String type,
            String label,
            String contactId,
            String messageId,
            String correctReplyId,
            boolean completed
    ) {
    }

    public record MessageSnapshot(
            String id,
            String contactId,
            String text,
            boolean fromPlayer,
            String taskId,
            boolean read,
            long timestamp
    ) {
    }

    public record EmailSnapshot(
            String id,
            String from,
            String subject,
            String body,
            String category,
            String taskId,
            boolean read
    ) {
    }

    public record TeamMemberSnapshot(
            String id,
            String name,
            String role,
            String avatar,
            String bio,
            String greeting
    ) {
    }
}
