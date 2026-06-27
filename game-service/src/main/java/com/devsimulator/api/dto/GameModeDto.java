package com.devsimulator.api.dto;

import com.devsimulator.model.GameMode;

public record GameModeDto(String id, String name, String description) {
    public static GameModeDto from(GameMode mode) {
        return new GameModeDto(mode.name(), mode.getDisplayName(), mode.getDescription());
    }
}
