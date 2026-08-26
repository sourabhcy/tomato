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
                git branch: 'main', url: 'https://github.com/sourabhcy/tomato'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Write Production Env File') {
            steps {
               sh '''
    cat > .env.production << EOF
DATABASE_URL=${DATABASE_URL}
SESSION_SECRET=${SESSION_SECRET}
NODE_ENV=production
EOF
'''
                '''
            }
        }

       

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    mkdir -p ${DEPLOY_DIR}
                    cp -r .next/standalone/* ${DEPLOY_DIR}/
                    mkdir -p ${DEPLOY_DIR}/.next
                    cp -r .next/static ${DEPLOY_DIR}/.next/static
                    cp -r public ${DEPLOY_DIR}/public
                    cp .env.production ${DEPLOY_DIR}/.env.production
                    cp ecosystem.config.js ${DEPLOY_DIR}/ecosystem.config.js

                    cd ${DEPLOY_DIR}
                    pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
                    pm2 save
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f .env.production'
        }
    }
}