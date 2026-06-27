package com.devsimulator.api.dto;

public record CalendarEventDto(
        String id,
        String title,
        String subtitle,
        String startTime,
        String endTime,
        String location,
        String organizer,
        String status,
        boolean joinable,
        String meetingId
) {
}
