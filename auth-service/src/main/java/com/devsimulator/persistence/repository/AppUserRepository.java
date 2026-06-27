package com.devsimulator.persistence.repository;

import com.devsimulator.persistence.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmailIgnoreCase(String email);

    Optional<AppUser> findByUsernameIgnoreCase(String username);

    Optional<AppUser> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByPhone(String phone);
}
