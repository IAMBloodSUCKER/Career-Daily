package com.devsimulator.api.dto;

public record AdminStatsDto(
        long userCount,
        long saveCount,
        long adminCount
) {
}
