pipeline {
    agent any

    environment {
        API_SONAR = 'https://sonarqube.buy01.site/api'
    }
//
    stages {

        stage('Initialize') {
            steps {
                sh 'java -version'
                sh 'mvn -version'
                sh 'docker --version'
                sh 'docker compose version'
            }
        }

        stage('SonarQube Frontend') {
            steps {
                script {
                    def failed = false

                    withCredentials([string(credentialsId: 'sonar-cred', variable: 'SONAR_TOKEN')]) {
                        try {
                            withSonarQubeEnv('sonarqube') {
                                dir('frontend') {

                                    sh """
                                    ${tool 'sonar8'}/bin/sonar-scanner \
                                    -Dsonar.projectKey=frontend \
                                    -Dsonar.sources=src \
                                    -Dsonar.exclusions=**/*.spec.ts \
                                    -Dsonar.pullrequest.key=${env.CHANGE_ID} \
                                    -Dsonar.pullrequest.branch=${env.BRANCH_NAME} \
                                    -Dsonar.pullrequest.base=${env.CHANGE_TARGET}
                                    """

                                    def ceTaskId = sh(
                                        script: "grep '^ceTaskId=' .scannerwork/report-task.txt | cut -d= -f2",
                                        returnStdout: true
                                    ).trim()

                                    timeout(time: 2, unit: 'MINUTES') {
                                        waitUntil {
                                            def status = sh(
                                                script: "curl -s -u \$SONAR_TOKEN: \$API_SONAR/ce/task?id=${ceTaskId} | jq -r '.task.status'",
                                                returnStdout: true
                                            ).trim()
                                            return status == 'SUCCESS'
                                        }
                                    }

                                    def analysisId = sh(
                                        script: "curl -s -u \$SONAR_TOKEN: \$API_SONAR/ce/task?id=${ceTaskId} | jq -r '.task.analysisId'",
                                        returnStdout: true
                                    ).trim()

                                    def qualityGate = sh(
                                        script: "curl -s -u \$SONAR_TOKEN: \$API_SONAR/qualitygates/project_status?analysisId=${analysisId} | jq -r '.projectStatus.status'",
                                        returnStdout: true
                                    ).trim()

                                    if (qualityGate != 'OK') {
                                        throw new Exception('Quality Gate FAILED')
                                    }

                                    echo '✅ Quality Gate PASSED for frontend'
                                }
                            }
                        } catch (err) {
                            echo "❌ Sonar FAILED frontend: ${err}"
                            failed = true
                        }
                    }

                    if (failed) {
                        slackSend(
                            channel: '#jenkins',
                            message: "❌ SonarQube FAILED frontend\nJob: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}",
                            tokenCredentialId: 'slack-cred'
                        )
                        currentBuild.result = 'FAILURE'
                        error('Quality Gate FAILED')
                    }
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline executed successfully!'
            slackSend channel: '#jenkins',
                message: "Build Success - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)",
                tokenCredentialId: 'slack-cred'
        }
        failure {
            echo 'Pipeline failed!'
            slackSend channel: '#jenkins',
                message: "Build Failed - ${env.JOB_NAME} ${env.BUILD_NUMBER} (<${env.BUILD_URL}|Open>)",
                tokenCredentialId: 'slack-cred'
        }
    }
}
