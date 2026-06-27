package com.devsimulator.api.dto;

import com.devsimulator.model.CodeChallenge;

public record CodeChallengeDto(String fileName, String starterCode, String hint, String currentCode) {
    public static CodeChallengeDto from(CodeChallenge c, String currentCode) {
        if (c == null) {
            return null;
        }
        return new CodeChallengeDto(c.fileName(), c.starterCode(), c.hint(), currentCode);
    }
}
