# 빌드 스테이지: Gradle 로 실행 가능한 jar 생성
FROM eclipse-temurin:17-jdk AS build
WORKDIR /workspace

COPY gradlew settings.gradle build.gradle ./
COPY gradle gradle
RUN chmod +x gradlew

# 의존성만 먼저 받아 캐시 레이어를 살린다 (소스만 바뀌면 이 레이어는 재사용됨)
RUN ./gradlew --no-daemon dependencies || true

COPY src src
RUN ./gradlew --no-daemon bootJar -x test

# 실행 스테이지: JDK 대신 더 가벼운 JRE 이미지만 사용
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/build/libs/*.jar app.jar

# Render 가 주입하는 PORT 를 application.yml 의 server.port 가 그대로 읽는다.
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
