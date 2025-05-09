pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install client dependencies') {
      steps {
        dir('client') {
          sh 'npm install'
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
        withCredentials([file(credentialsId: 'realestate_server_env', variable: 'SERVER_ENV_FILE')]) {
          dir('server') {
          sh '''
            cp "${SERVER_ENV_FILE}" .env
              chmod 600 .env
              npm run test
              rm -f .env 
          '''
          }
        }
      }
    }

    stage('Run server') {
      steps {
        dir('server') {
          sh 'npm run start'
        }
      }
    }
  }
} 