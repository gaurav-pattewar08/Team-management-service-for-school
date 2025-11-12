pipeline {
    agent any
    stages {
        stage('Run Dev') {
            steps {
                sh 'docker compose --profile dev up -d --build'
            }
        }
    }
}
