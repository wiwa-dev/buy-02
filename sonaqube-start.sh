docker run -d --name sonarqube-dind \
-e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
-p 9000:9000 \
--network jenkins-java \
sonarqube:latest
