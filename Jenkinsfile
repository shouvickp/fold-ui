pipeline {
    agent any

    environment {
        DOCKER_IMAGE = "docker.io/shouvickp/fold-frontend"
        APP_SERVER = "ubuntu@13.126.188.229"
        VERSION = "latest"
    }

    stages {

        stage('Clone Repository') {
            steps {
                git 'https://github.com/shouvickp/fold-ui.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:$VERSION .'
            }
        }

        stage('Push Image') {
            steps {
                sh 'docker push $DOCKER_IMAGE:$VERSION'
            }
        }

        stage('Deploy') {
            steps {
                sh """
                ssh $APP_SERVER '
                docker pull $DOCKER_IMAGE:$VERSION
                docker stop fold-ui || true
                docker rm fold-ui || true
                docker run -d -p 3000:3000 --name fold-ui $DOCKER_IMAGE:$VERSION
                '
                """
            }
        }
    }
}