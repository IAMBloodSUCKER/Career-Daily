ARG MAVEN_IMAGE=maven:3.9-eclipse-temurin-17-alpine
ARG JRE_IMAGE=eclipse-temurin:17-jre-alpine

FROM ${MAVEN_IMAGE} AS build
WORKDIR /app
COPY pom.xml .
COPY common common
COPY auth-service auth-service
COPY game-service/pom.xml game-service/pom.xml
COPY gateway/pom.xml gateway/pom.xml
RUN mvn -B -q package -pl auth-service -am -DskipTests

FROM ${JRE_IMAGE}
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=build /app/auth-service/target/auth-service-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
