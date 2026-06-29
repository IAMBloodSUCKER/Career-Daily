package com.devsimulator.service;



import com.devsimulator.api.dto.AuthUserDto;

import com.devsimulator.api.dto.LoginRequest;

import com.devsimulator.api.dto.RegisterRequest;

import com.devsimulator.persistence.entity.AppUser;

import com.devsimulator.persistence.repository.AppUserRepository;

import com.devsimulator.security.AppUserPrincipal;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;



@Service

public class AuthService {



    private final AppUserRepository appUserRepository;

    private final PasswordEncoder passwordEncoder;

    private final ConsentService consentService;



    public AuthService(AppUserRepository appUserRepository,

                       PasswordEncoder passwordEncoder,

                       ConsentService consentService) {

        this.appUserRepository = appUserRepository;

        this.passwordEncoder = passwordEncoder;

        this.consentService = consentService;

    }



    @Transactional

    public AuthUserDto register(RegisterRequest request, String ipAddress, String userAgent) {

        if (!Boolean.TRUE.equals(request.personalDataConsent())) {

            throw new IllegalArgumentException("Необходимо согласие на обработку персональных данных (152-ФЗ)");

        }

        if (!Boolean.TRUE.equals(request.termsAccepted())) {

            throw new IllegalArgumentException("Необходимо принять пользовательское соглашение");

        }



        String username = request.username().trim();

        if (appUserRepository.existsByUsernameIgnoreCase(username)) {

            throw new IllegalArgumentException("Имя пользователя занято");

        }



        AppUser user = new AppUser(

                null,

                null,

                username,

                passwordEncoder.encode(request.password()),

                request.displayName().trim(),

                false

        );

        user = appUserRepository.save(user);

        consentService.recordRegistrationConsent(user, ipAddress, userAgent);

        user = appUserRepository.save(user);

        return toDto(user);

    }



    public AuthUserDto toDto(AppUser user) {

        return new AuthUserDto(

                user.getId(),

                user.getUsername(),

                user.getEmail(),

                user.getPhone(),

                user.getDisplayName(),

                user.isAdmin()

        );

    }



    public AuthUserDto toDto(AppUserPrincipal principal) {

        return new AuthUserDto(

                principal.getId(),

                principal.getUsername(),

                principal.getEmail(),

                principal.getPhone(),

                principal.getDisplayName(),

                principal.isAdmin()

        );

    }



    public static String normalizeLogin(LoginRequest request) {

        return request.login().trim();

    }

}

