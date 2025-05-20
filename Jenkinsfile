pipeline {

  agent any

  tools {
    nodejs 'node:22'
  }

  environment {
    DOCKER_IMAGE = 'novadityap/real-estate-server'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Prepare environment files') {
      steps {
        script {
          def clientEnv = readProperties file: '/var/jenkins_home/env/.env.client.realestate'
          writeFile file: '.env.client', text: clientEnv.collect { k, v -> "${k}=${v}" }.join('\n')
        }
      }
    }

    stage('Install client dependencies and build') {
      steps {
         dir('client') {
          sh '''
            cp ../.env.client .env
            npm install
            npm run build
          '''
        }
      }
    }

    stage('Install server dependencies') {
      steps {
        dir('server') {
          sh 'npm install'
        }
      }
    }

    stage('Test server') {
      steps {
        dir('server') {
          sh '''
            cp /var/jenkins_home/env/.env.server.realestate .env
            set -a
            source .env
            set +a
            npm run test
          '''
        }
      }
    }

    stage('Build Docker image') {
      steps {
        dir('server') {
          sh 'docker build -t $DOCKER_IMAGE .'
        }
      }
    }

    stage('Push Docker image') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push $DOCKER_IMAGE
          '''
        }
      }
    }
  }
} 