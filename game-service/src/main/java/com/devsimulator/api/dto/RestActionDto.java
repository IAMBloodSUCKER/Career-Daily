package com.devsimulator.api.dto;

import com.devsimulator.model.RestAction;

import java.util.Arrays;
import java.util.List;

public record RestActionDto(String id, String title, String description, int durationHours) {
    public static RestActionDto from(RestAction action) {
        return new RestActionDto(
                action.name(),
                action.getTitle(),
                action.getDescription(),
                action.getDurationHours()
        );
    }

    public static List<RestActionDto> all() {
        return Arrays.stream(RestAction.values()).map(RestActionDto::from).toList();
    }
}
