pipeline {
    agent any

    environment {
        DOCKER_URL = "docker.io/shouvickp"
        APP_SERVER = "ubuntu@13.126.188.229"
        DOCKER_IMAGE = "shouvickp/fold-frontend"
        VERSION = "latest"
    }

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main', url: 'https://github.com/shouvickp/fold-ui.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t $DOCKER_IMAGE:$VERSION .'
            }
        }

        stage('Push Image to DockerHub') {
            steps {
                script {
                    withCredentials ([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'ARTIFACTORY_USER', passwordVariable: 'ARTIFACTORY_PASSWORD')]) {
                        sh '''
                        echo $ARTIFACTORY_PASSWORD | docker login -u ${ARTIFACTORY_USER} --password-stdin
                        docker push $DOCKER_IMAGE:$VERSION
                        '''
                    }
                }
            }
        }

        stage('Cleanup Docker') {
            steps {
                sh 'docker system prune -f'
            }
        }

        stage('Deploy to Server') {
            steps {
                withCredentials([
                    string(credentialsId: 'API_BASE_URL', variable: 'API_BASE_URL')
                ]) {
                    sh """
                    ssh $APP_SERVER '
                    docker pull $DOCKER_IMAGE:$VERSION
                    docker stop fold-frontend || true
                    docker rm fold-frontend || true
                    docker run -d -p 3000:3000 \
                    -e API_BASE_URL="${API_BASE_URL}" \
                    --name fold-frontend \
                    $DOCKER_IMAGE:$VERSION
                    '
                    """
                }
            }
        }
    }
}