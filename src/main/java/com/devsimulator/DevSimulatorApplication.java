package com.devsimulator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.boot.context.properties.EnableConfigurationProperties({
        com.devsimulator.config.AdminProperties.class,
        com.devsimulator.config.PortalNewsProperties.class
})
@org.springframework.scheduling.annotation.EnableScheduling
public class DevSimulatorApplication {

    public static void main(String[] args) {
        SpringApplication.run(DevSimulatorApplication.class, args);
    }
}
