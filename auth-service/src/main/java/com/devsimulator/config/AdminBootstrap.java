package com.devsimulator.config;

import com.devsimulator.persistence.entity.AppUser;
import com.devsimulator.persistence.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AdminProperties adminProperties;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrap(AdminProperties adminProperties,
                          AppUserRepository appUserRepository,
                          PasswordEncoder passwordEncoder) {
        this.adminProperties = adminProperties;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!adminProperties.isBootstrapEnabled()) {
            return;
        }
        String username = adminProperties.getUsername().trim();
        appUserRepository.findByUsernameIgnoreCase(username).ifPresentOrElse(
                this::ensureAdmin,
                () -> createAdmin(username)
        );
    }

    private void ensureAdmin(AppUser user) {
        if (!user.isAdmin()) {
            user.grantAdmin();
            appUserRepository.save(user);
            log.info("Granted admin role to existing user '{}'", user.getUsername());
        }
    }

    private void createAdmin(String username) {
        AppUser admin = new AppUser(
                adminProperties.getEmail().trim().toLowerCase(),
                null,
                username,
                passwordEncoder.encode(adminProperties.getPassword()),
                adminProperties.getDisplayName().trim(),
                true
        );
        appUserRepository.save(admin);
        log.info("Admin user created: login='{}' (password from app.admin.password)", username);
    }
}
