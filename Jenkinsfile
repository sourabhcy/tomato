pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    environment {
        DEPLOY_DIR = '/opt/apps/ecommerce-app'
        DATABASE_URL = credentials('prod-database-url')
        SESSION_SECRET = credentials('SESSION_SECRET')
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'ecom-next', url: 'https://github.com/sourabhcy/tomato'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build & Deploy') {
            steps {
                sh './scripts/deploy.sh'
            }
        }
    }

    post {
        always {
            sh 'rm -f .env.production'
        }
    }
}