package com.devsimulator.api.dto;

import com.devsimulator.model.HrWarning;

public record HrWarningDto(int day, String reason) {
    public static HrWarningDto from(HrWarning w) {
        return new HrWarningDto(w.day(), w.reason());
    }
}
