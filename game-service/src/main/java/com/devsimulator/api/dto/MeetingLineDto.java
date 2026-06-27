package com.devsimulator.api.dto;

import java.util.List;

public record MeetingLineDto(
        String speakerId,
        String speakerName,
        String avatar,
        String role,
        String text,
        boolean playerTurn,
        List<MeetingOptionDto> options
) {
}
