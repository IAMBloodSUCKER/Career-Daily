package com.devsimulator;

import com.devsimulator.common.CommonAutoConfiguration;
import com.devsimulator.config.AdminProperties;
import com.devsimulator.config.CaptchaProperties;
import com.devsimulator.config.GameServiceClientProperties;
import com.devsimulator.config.LegalProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonAutoConfiguration.class)
@EnableConfigurationProperties({AdminProperties.class, GameServiceClientProperties.class, CaptchaProperties.class, LegalProperties.class})
public class AuthServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
