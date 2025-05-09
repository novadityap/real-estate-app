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
        dir('server') {
          sh 'npm run test'
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

  post {
    always {
      echo 'Pipeline has finished running'
    }
    success {
      echo 'Pipeline executed successfully'
    }
    failure {
      echo 'Pipeline execution failed'
    }
  }
} 