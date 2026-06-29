package com.devsimulator.persistence.repository;

import com.devsimulator.persistence.entity.UserConsentLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserConsentLogRepository extends JpaRepository<UserConsentLog, Long> {
}
