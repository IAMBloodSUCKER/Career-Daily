package com.devsimulator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.legal")
public class LegalProperties {

    /** Полное имя оператора (ФИО физлица, ИП или наименование ООО). */
    private String operatorName = "Оператор сервиса Java Dev Daily (физическое лицо)";

    /** ИНН оператора (12 цифр для физлица/ИП, 10 для ООО). Необязательно для физлица. */
    private String operatorInn = "";

    /** ОГРН / ОГРНИП. */
    private String operatorOgrn = "";

    /** Юридический / почтовый адрес оператора в РФ. */
    private String operatorAddress = "Российская Федерация";

    /** Email для запросов по персональным данным (152-ФЗ). */
    private String privacyEmail = "privacy@example.com";

    /** Email технической поддержки. */
    private String supportEmail = "support@example.com";

    /** Публичный URL сервиса (без слэша в конце). */
    private String siteUrl = "http://localhost:3000";

    /** Версия политики / согласия. Меняйте при обновлении документов. */
    private String policyVersion = "2026-06-26";

    /** Версия пользовательского соглашения. */
    private String termsVersion = "2026-06-26";

    public String getOperatorName() {
        return operatorName;
    }

    public void setOperatorName(String operatorName) {
        this.operatorName = operatorName;
    }

    public String getOperatorInn() {
        return operatorInn;
    }

    public void setOperatorInn(String operatorInn) {
        this.operatorInn = operatorInn;
    }

    public String getOperatorOgrn() {
        return operatorOgrn;
    }

    public void setOperatorOgrn(String operatorOgrn) {
        this.operatorOgrn = operatorOgrn;
    }

    public String getOperatorAddress() {
        return operatorAddress;
    }

    public void setOperatorAddress(String operatorAddress) {
        this.operatorAddress = operatorAddress;
    }

    public String getPrivacyEmail() {
        return privacyEmail;
    }

    public void setPrivacyEmail(String privacyEmail) {
        this.privacyEmail = privacyEmail;
    }

    public String getSupportEmail() {
        return supportEmail;
    }

    public void setSupportEmail(String supportEmail) {
        this.supportEmail = supportEmail;
    }

    public String getSiteUrl() {
        return siteUrl;
    }

    public void setSiteUrl(String siteUrl) {
        this.siteUrl = siteUrl;
    }

    public String getPolicyVersion() {
        return policyVersion;
    }

    public void setPolicyVersion(String policyVersion) {
        this.policyVersion = policyVersion;
    }

    public String getTermsVersion() {
        return termsVersion;
    }

    public void setTermsVersion(String termsVersion) {
        this.termsVersion = termsVersion;
    }

    public String operatorRequisitesLine() {
        StringBuilder sb = new StringBuilder(operatorName);
        if (operatorInn != null && !operatorInn.isBlank()) {
            sb.append(", ИНН ").append(operatorInn.trim());
        }
        if (operatorOgrn != null && !operatorOgrn.isBlank()) {
            sb.append(", ОГРН").append(operatorOgrn.trim().length() == 15 ? "ИП " : " ").append(operatorOgrn.trim());
        }
        return sb.toString();
    }
}
