# CI/CD Deployment for Fold Frontend using Jenkins, Docker, and AWS EC2

## Overview

This project implements a **CI/CD pipeline** to automatically build and deploy the **Fold Frontend application** using **Jenkins**, **Docker**, **Docker Hub**, and **AWS EC2**.

Whenever new code is pushed to the GitHub repository, Jenkins automatically:

1. Clones the latest source code.
2. Builds a Docker image of the frontend application.
3. Pushes the image to Docker Hub.
4. Deploys the updated container to the application server.

This enables **automated and consistent deployments** without manual intervention.

---

# Architecture

```
Developer
   │
   │ git push
   ▼
GitHub Repository
   │
   │ Webhook Trigger
   ▼
Jenkins CI Server (EC2)
   │
   │ Build Docker Image
   │ Push Image → Docker Hub
   ▼
Application Server (EC2)
   │
   │ Pull latest Docker Image
   │ Restart Container
   ▼
Running Frontend Application
```

---

# Infrastructure

## Jenkins Server (EC2)

Purpose:

* Execute CI/CD pipelines
* Build Docker images
* Push images to Docker Hub
* Deploy containers via SSH

Installed Tools:

* Jenkins
* Docker
* Git

---

## Application Server (EC2)

Purpose:

* Run the frontend container
* Serve the application

Installed Tools:

* Docker

---

# Technologies Used

* Jenkins (CI/CD automation)
* Docker (Containerization)
* Docker Hub (Image registry)
* AWS EC2 (Infrastructure)
* GitHub (Source code management)
* SSH (Remote deployment)

---

# Source Code Repository

GitHub Repository:

```
https://github.com/shouvickp/fold-ui
```

Docker Image Repository:

```
docker.io/shouvickp/fold-frontend
```

---

# CI/CD Pipeline Workflow

The Jenkins pipeline executes the following stages:

1. **Clone Repository**
   Jenkins clones the latest code from the GitHub repository.

2. **Build Docker Image**
   Jenkins builds a Docker image for the frontend application.

3. **Push Image to Docker Hub**
   The image is pushed to Docker Hub so it can be pulled by the deployment server.

4. **Cleanup Docker Images**
   Removes unused images to prevent disk space issues on the Jenkins server.

5. **Deploy to Application Server**
   Jenkins connects to the EC2 server via SSH, pulls the latest image, and runs the container.

---

# Jenkins Pipeline Configuration

```
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
```

---

# Secrets Management

Sensitive values are stored securely using **Jenkins Credentials**.

Configured secrets:

```
dockerhub
API_BASE_URL
```

These values are injected into the pipeline during deployment.

---

# Deployment Process

When a developer pushes code:

```
git add .
git commit -m "update frontend"
git push origin main
```

The following process is automatically triggered:

1. GitHub sends a webhook event to Jenkins.
2. Jenkins starts the pipeline.
3. Jenkins builds the Docker image.
4. Jenkins logs in to Docker Hub and pushes the image.
5. Jenkins connects to the application server via SSH.
6. The previous container is stopped and removed.
7. A new container is started with the latest image.

---

# Docker Run Command

The application container is started using:

```
docker run -d -p 3000:3000 \
-e API_BASE_URL=<api-url> \
--name fold-frontend \
shouvickp/fold-frontend:latest
```

---

# Accessing the Application

After deployment, the frontend application is available at:

```
http://<SERVER_IP>:3000
```

Example:

```
http://13.126.188.229:3000
```

---

# GitHub Webhook Configuration

To trigger Jenkins automatically on code push, configure a webhook in GitHub.

Webhook URL:

```
http://<JENKINS_SERVER_IP>:8080/github-webhook/
```

Trigger event:

```
Push events
```

---

# Docker Cleanup

The pipeline includes a cleanup step:

```
docker system prune -f
```

This removes unused Docker images and containers to free disk space.

---

# Verification

Check running containers on the server:

```
```
