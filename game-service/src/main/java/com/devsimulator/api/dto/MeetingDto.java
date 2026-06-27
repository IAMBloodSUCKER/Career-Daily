package com.devsimulator.api.dto;

import java.util.List;

public record MeetingDto(
        String id,
        String title,
        String subtitle,
        List<MeetingLineDto> lines,
        boolean active,
        boolean completed
) {
}
