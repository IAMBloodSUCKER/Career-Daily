package com.devsimulator.service;

import com.devsimulator.api.dto.CalendarEventDto;
import com.devsimulator.api.dto.MeetingDto;
import com.devsimulator.model.GameBalance;
import com.devsimulator.model.GameMode;
import com.devsimulator.model.ObjectiveType;
import com.devsimulator.model.Player;
import com.devsimulator.model.ProjectProfile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class OfficeCalendarService {

    private OfficeCalendarService() {
    }

    public static List<CalendarEventDto> build(InteractiveGameEngine engine) {
        Player player = engine.getPlayer();
        ProjectProfile profile = engine.getProjectProfile();
        MeetingDto pending = engine.getPendingMeeting();
        MeetingDto queued = engine.getQueuedMeeting();
        boolean missedToday = engine.isMeetingMissedToday();
        int hour = engine.getCurrentHour();
        int minute = engine.getCurrentMinute();
        int now = hour * 60 + minute;

        String leadName = profile.team().isEmpty() ? "Team Lead" : profile.team().get(0).name();
        List<CalendarEventDto> events = new ArrayList<>();

        boolean standupWaiting = engine.getScheduledDailyStandup() != null;
        boolean standupDone = isMeetingDone(engine, "MEET-daily");
        events.add(meetingEvent(
                "cal-standup-day-" + player.getDay(),
                "daily-standup-day-" + player.getDay(),
                "📹 Daily Standup",
                profile.companyName() + " · " + profile.slackChannel(),
                GameBalance.standupStartTimeLabel(), GameBalance.standupEndTimeLabel(),
                "Google Meet",
                leadName,
                resolveMeetingStatus("daily-standup", pending, missedToday, standupDone, standupWaiting, now,
                        GameBalance.standupStartMinutes(), GameBalance.standupEndMinutes()),
                pending,
                now
        ));

        if (engine.getMode() == GameMode.REALISTIC || engine.getMode() == GameMode.CHALLENGE) {
            boolean syncDone = engine.isSprintSyncAttendedToday();
            events.add(meetingEvent(
                    "cal-sprint-sync-day-" + player.getDay(),
                    "sprint-sync-day-" + player.getDay(),
                    "📅 Sprint Sync",
                    profile.productName(),
                    GameBalance.sprintSyncStartTimeLabel(), GameBalance.sprintSyncEndTimeLabel(),
                    "Google Meet",
                    leadName,
                    resolveSprintSyncStatus(pending, queued, standupDone, syncDone, now),
                    pending,
                    now
            ));
        }

        events.add(blockEvent(
                "cal-lunch-day-" + player.getDay(),
                "🍽 Обед",
                "Свободный слот · не бронировать",
                "13:00", "14:00",
                "Кухня / офис",
                now
        ));

        if (player.getDay() % 2 == 0) {
            events.add(blockEvent(
                    "cal-review-day-" + player.getDay(),
                    "👀 Code Review hour",
                    "Открытые PR в GitHub / GitLab",
                    "14:30", "15:00",
                    profile.slackChannel(),
                    now
            ));
        }

        if (player.getDay() % 3 == 1) {
            events.add(blockEvent(
                    "cal-1on1-day-" + player.getDay(),
                    "☕ 1:1 с Team Lead",
                    "Карьера, обратная связь, цели спринта",
                    "16:00", "16:30",
                    "Переговорка / Meet",
                    now
            ));
        }

        events.add(blockEvent(
                "cal-eod-day-" + player.getDay(),
                "📊 EOD check-in",
                "Статус в Slack перед уходом",
                "16:45", "17:00",
                profile.slackChannel(),
                now
        ));

        events.sort(Comparator.comparing(CalendarEventDto::startTime));
        return events;
    }

    private static CalendarEventDto meetingEvent(
            String id,
            String meetingId,
            String title,
            String subtitle,
            String start,
            String end,
            String location,
            String organizer,
            String status,
            MeetingDto pending,
            int now
    ) {
        boolean joinable = "live".equals(status)
                && pending != null
                && meetingId.equals(pending.id());
        return new CalendarEventDto(id, title, subtitle, start, end, location, organizer, status, joinable, joinable ? pending.id() : null);
    }

    private static CalendarEventDto blockEvent(
            String id, String title, String subtitle, String start, String end, String location, int now
    ) {
        int startMin = toMinutes(start);
        int endMin = toMinutes(end);
        String status;
        if (now >= endMin) {
            status = "completed";
        } else if (now >= startMin) {
            status = "live";
        } else {
            status = "upcoming";
        }
        return new CalendarEventDto(id, title, subtitle, start, end, location, "", status, false, null);
    }

    private static String resolveMeetingStatus(
            String idPrefix,
            MeetingDto pending,
            boolean missedToday,
            boolean objectiveDone,
            boolean scheduledWaiting,
            int now,
            int startMin,
            int endMin
    ) {
        if (pending != null && pending.id().startsWith(idPrefix)) {
            return now >= startMin ? "live" : "upcoming";
        }
        if (scheduledWaiting && "daily-standup".equals(idPrefix)) {
            if (now >= endMin) {
                return "missed";
            }
            return now >= startMin ? "live" : "upcoming";
        }
        if (missedToday && "daily-standup".equals(idPrefix)) {
            if (now < endMin && !objectiveDone) {
                return now >= startMin ? "live" : "upcoming";
            }
            return "missed";
        }
        if (objectiveDone) {
            return "completed";
        }
        if (now >= endMin) {
            return "missed";
        }
        if (now < startMin) {
            return "upcoming";
        }
        return "upcoming";
    }

    private static String resolveSprintSyncStatus(
            MeetingDto pending,
            MeetingDto queued,
            boolean standupDone,
            boolean syncDone,
            int now
    ) {
        if (pending != null && pending.id().startsWith("sprint-sync")) {
            return "live";
        }
        if (syncDone) {
            return "completed";
        }
        if (!standupDone) {
            return "upcoming";
        }
        if (queued != null) {
            return "upcoming";
        }
        int end = 12 * 60;
        if (now >= GameBalance.sprintSyncEndMinutes()) {
            return "missed";
        }
        return "upcoming";
    }

    private static boolean isMeetingDone(InteractiveGameEngine engine, String ticketPrefix) {
        return engine.getAllTasks().stream()
                .filter(t -> t.getTicketId() != null && t.getTicketId().startsWith(ticketPrefix))
                .flatMap(t -> t.getObjectives().stream())
                .anyMatch(o -> o.getType() == ObjectiveType.ATTEND_MEETING && o.isCompleted());
    }

    private static int toMinutes(String hhmm) {
        String[] parts = hhmm.split(":");
        return Integer.parseInt(parts[0]) * 60 + Integer.parseInt(parts[1]);
    }
}
