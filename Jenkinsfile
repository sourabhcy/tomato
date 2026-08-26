pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    environment {
        IMAGE_NAME = 'ecommerce-app'
        CONTAINER_NAME = 'ecommerce-app'
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

        stage('Build Docker Image') {
            steps {
                sh 'docker build --label version=${BUILD_NUMBER} -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest .'
            }
        }

            stage('Deploy') {
            steps {
                sh '''
                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    docker run -d \
                      --name ${CONTAINER_NAME} \
                      --network host \
                      --restart unless-stopped \
                      -e DATABASE_URL="${DATABASE_URL}" \
                      -e SESSION_SECRET="${SESSION_SECRET}" \
                      -e NODE_ENV=production \
                      -e HOSTNAME=0.0.0.0 \
                      ${IMAGE_NAME}:latest
                '''
            }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(time: 5, unit: 'SECONDS')
                    def health = sh(script: 'curl -sf http://localhost:3000/login', returnStatus: true)
                    if (health != 0) {
                        error("Health check failed after deploy")
                    }
                }
            }
        }
    }

    post {
        failure {
            sh 'docker logs ${CONTAINER_NAME} --tail 50 || true'
        }
        success {
            echo 'Deployed successfully.'
        }
    }

}