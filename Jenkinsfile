pipeline {
  agent any

  environment {
    SERVER_ENV = credentials('realestate_server_env')
    CLIENT_ENV = credentials('realestate_client_env')
  }

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
        withCredentials([file(credentialsId: 'realestate_server_env', variable: 'SERVER_ENV')]) {
          dir('server') {
          sh '''
            cp "${SERVER_ENV}" .env
            npm run test
          '''
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