pipeline {
    agent any

    stages {
        stage('Start') {
            agent{
                docker{
                    image 'node:22-alpine'
                    reuseNode true
                }
            }
            steps {
                sh '''
                   npm ci
                   npm run start
                '''
            }
        }
       
    }
}
