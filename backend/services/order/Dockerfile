# Stage 2: Run (le JAR est déjà buildé par Maven dans le pipeline CI)
FROM eclipse-temurin:17-jre-alpine
LABEL ci=true
WORKDIR /app

# Copier le JAR généré par 'mvn clean package'
COPY target/*.jar app.jar

# Variables d'environnement
ENV SPRING_PROFILES_ACTIVE=prod

# Lancer l'application
ENTRYPOINT ["java", "-jar", "app.jar"]
