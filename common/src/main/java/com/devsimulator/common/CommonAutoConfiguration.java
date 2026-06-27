package com.devsimulator.common;

import com.devsimulator.common.security.JwtProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Configuration;

@Configuration
@ComponentScan(basePackages = "com.devsimulator.common")
@EnableConfigurationProperties(JwtProperties.class)
public class CommonAutoConfiguration {
}
