pipeline {
    agent any
    stages {
        stage('Prepare Env') {
            steps {
                script {
                    writeFile file: '.env.docker', text: '''
DB_HOST=db
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=gaurav
DB_NAME=test
JWT_SECRET=your_jwt_secret_key
OUTLOOK_EMAIL=gaurav.pattewar@talentica.com
OUTLOOK_PASSWORD=qswaed@321
CLOUDINARY_CLOUD_NAME=davm2nuya
CLOUDINARY_API_KEY=622563221656349
CLOUDINARY_API_SECRET=LNeSVdRCaVRZMUDfo47RDzg9oKU
APP_URL=http://localhost:3000
NODE_ENV=production
'''
                }
            }   
        }

        stage('Run Dev') {
            steps {
                sh 'docker compose --profile dev up -d --build'
            }
        }
    }
}
