package com.devsimulator;

import com.devsimulator.common.CommonAutoConfiguration;
import com.devsimulator.config.InternalApiProperties;
import com.devsimulator.config.PortalNewsProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Import;

@SpringBootApplication
@Import(CommonAutoConfiguration.class)
@EnableConfigurationProperties({PortalNewsProperties.class, InternalApiProperties.class})
public class GameServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(GameServiceApplication.class, args);
    }
}
