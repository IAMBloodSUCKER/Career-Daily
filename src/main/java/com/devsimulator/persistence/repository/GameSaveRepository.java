package com.devsimulator.persistence.repository;

import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.entity.GameSave;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GameSaveRepository extends JpaRepository<GameSave, Long> {
    Optional<GameSave> findByUser(AppUser user);

    Optional<GameSave> findByUserId(Long userId);

    void deleteByUserId(Long userId);
}
