package com.devsimulator.api;

import com.devsimulator.persistence.entity.GameSave;
import com.devsimulator.persistence.repository.GameSaveRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal/saves")
public class InternalGameController {

    private final GameSaveRepository gameSaveRepository;

    public InternalGameController(GameSaveRepository gameSaveRepository) {
        this.gameSaveRepository = gameSaveRepository;
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        Map<String, Long> result = new HashMap<>();
        result.put("saveCount", gameSaveRepository.count());
        return result;
    }

    @GetMapping("/summaries")
    public List<Map<String, Object>> summaries() {
        return gameSaveRepository.findAll().stream()
                .map(this::toSummaryRow)
                .toList();
    }

    @DeleteMapping("/{userId}")
    public void deleteByUserId(@PathVariable Long userId) {
        gameSaveRepository.deleteByUserId(userId);
    }

    private Map<String, Object> toSummaryRow(GameSave save) {
        String summary = save.getPlayerName() + " · день " + save.getGameDay()
                + (save.getCompanyName() != null ? " · " + save.getCompanyName() : "");
        return Map.of("userId", save.getUserId(), "summary", summary);
    }
}
