package com.devsimulator.model;

import java.util.List;

public record CodeChallenge(
        String fileName,
        String starterCode,
        String hint,
        List<String> requiredFragments,
        List<String> forbiddenFragments
) {
}
