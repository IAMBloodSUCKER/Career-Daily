package com.devsimulator.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "users")
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    @Column(unique = true, length = 16)
    private String phone;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(name = "display_name", nullable = false, length = 128)
    private String displayName;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean admin = false;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "pd_consent_at")
    private Instant pdConsentAt;

    @Column(name = "pd_consent_version", length = 32)
    private String pdConsentVersion;

    @Column(name = "terms_accepted_at")
    private Instant termsAcceptedAt;

    @Column(name = "terms_version", length = 32)
    private String termsVersion;

    protected AppUser() {
    }

    public AppUser(String email, String phone, String username, String passwordHash, String displayName, boolean admin) {
        this.email = email;
        this.phone = phone;
        this.username = username;
        this.passwordHash = passwordHash;
        this.displayName = displayName;
        this.admin = admin;
    }

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getDisplayName() {
        return displayName;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void grantAdmin() {
        this.admin = true;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getPdConsentAt() {
        return pdConsentAt;
    }

    public String getPdConsentVersion() {
        return pdConsentVersion;
    }

    public Instant getTermsAcceptedAt() {
        return termsAcceptedAt;
    }

    public String getTermsVersion() {
        return termsVersion;
    }

    public void setPdConsentAt(Instant pdConsentAt) {
        this.pdConsentAt = pdConsentAt;
    }

    public void setPdConsentVersion(String pdConsentVersion) {
        this.pdConsentVersion = pdConsentVersion;
    }

    public void setTermsAcceptedAt(Instant termsAcceptedAt) {
        this.termsAcceptedAt = termsAcceptedAt;
    }

    public void setTermsVersion(String termsVersion) {
        this.termsVersion = termsVersion;
    }
}
