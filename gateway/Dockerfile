ARG MAVEN_IMAGE=maven:3.9-eclipse-temurin-17-alpine
ARG JRE_IMAGE=eclipse-temurin:17-jre-alpine

FROM ${MAVEN_IMAGE} AS build
WORKDIR /app
COPY pom.xml .
COPY common/pom.xml common/pom.xml
COPY auth-service/pom.xml auth-service/pom.xml
COPY game-service/pom.xml game-service/pom.xml
COPY gateway gateway
RUN mvn -B -q package -pl gateway -am -DskipTests

FROM ${JRE_IMAGE}
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=build /app/gateway/target/gateway-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
