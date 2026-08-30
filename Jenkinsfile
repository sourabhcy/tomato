pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Target environment to build and deploy')
        string(name: 'BRANCH_NAME', defaultValue: 'staging', description: 'Git branch to build and deploy')
    }

    environment {
        IMAGE_NAME = 'ecommerce-app'
        REGISTRY   = 'registry.digitalocean.com/ecom-next-registry'

        // --- Droplet connection (production only) ---
        DROPLET_IP     = '168.144.188.162'
        DROPLET_SSH_CREDENTIALS_ID = 'digitalocean-droplet'
        // Note: SSH username is pulled automatically from the credential itself (see SSH_USER binding below), not hardcoded here.

        // --- Deploy locations ---
        STAGING_DEPLOY_DIR = '/var/lib/jenkins/deployments/ecommerce-app-staging'
        PRODUCTION_DEPLOY_DIR = '/opt/apps/ecommerce-app'

        SESSION_SECRET = credentials('SESSION_SECRET')
        NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID = credentials('new-relic-account-id')
        NEXT_PUBLIC_NEW_RELIC_AGENT_ID = credentials('new-relic-agent-id')
        NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID = credentials('new-relic-application-id')
        NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY = credentials('new-relic-license-key')
        NEXT_PUBLIC_NEW_RELIC_TRUST_KEY = credentials('new-relic-trust-key')
    }

    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }

        stage('Checkout') {
            steps {
                git branch: "${params.BRANCH_NAME}", url: 'https://github.com/sourabhcy/tomato'
                sh 'git log -1 --format="Building commit: %H - %s"'
            }
        }

        stage('Unit Tests') {
            steps {
                echo "Running tests on branch: ${params.BRANCH_NAME} (env: ${params.DEPLOY_ENV})"
                sh 'npm ci'
                sh 'npm test -- --ci'
                sh 'npm run lint'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    if (params.DEPLOY_ENV == 'production') {
                        sh '''
                            docker build \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID="${NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_AGENT_ID="${NEXT_PUBLIC_NEW_RELIC_AGENT_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID="${NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY="${NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_TRUST_KEY="${NEXT_PUBLIC_NEW_RELIC_TRUST_KEY}" \
                              --label version=${BUILD_NUMBER} \
                              -t ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER} \
                              -t ${REGISTRY}/${IMAGE_NAME}:latest .
                        '''
                    } else {
                        sh '''
                            docker build \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID="${NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_AGENT_ID="${NEXT_PUBLIC_NEW_RELIC_AGENT_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID="${NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY="${NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY}" \
                              --build-arg NEXT_PUBLIC_NEW_RELIC_TRUST_KEY="${NEXT_PUBLIC_NEW_RELIC_TRUST_KEY}" \
                              -t ${IMAGE_NAME}:staging .
                        '''
                    }
                }
            }
        }

        stage('Push to DO Registry') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([string(credentialsId: 'digitalocean_secreat_api_key', variable: 'DO_API_TOKEN')]) {
                    sh '''
                        echo "${DO_API_TOKEN}" | docker login registry.digitalocean.com -u unused --password-stdin
                        docker push ${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}
                        docker push ${REGISTRY}/${IMAGE_NAME}:latest
                    '''
                }
            }
        }

        stage('Prepare Env File') {
            steps {
                script {
                    def pgUserCred = params.DEPLOY_ENV == 'production' ? 'postgres-user' : 'postgres-user-staging'
                    def pgPassCred = params.DEPLOY_ENV == 'production' ? 'postgres-password' : 'postgres-password-staging'
                    def pgDbCred   = params.DEPLOY_ENV == 'production' ? 'postgres-db' : 'postgres-db-staging'
                    def envFile    = params.DEPLOY_ENV == 'production' ? '.env' : '.env.staging'

                    withCredentials([
                        string(credentialsId: pgUserCred, variable: 'POSTGRES_USER'),
                        string(credentialsId: pgPassCred, variable: 'POSTGRES_PASSWORD'),
                        string(credentialsId: pgDbCred, variable: 'POSTGRES_DB')
                    ]) {
                        sh """
                            cat > ${envFile} << ENVEOF
NODE_ENV=production
POSTGRES_USER=\${POSTGRES_USER}
POSTGRES_PASSWORD=\${POSTGRES_PASSWORD}
POSTGRES_DB=\${POSTGRES_DB}
DATABASE_URL=postgres://\${POSTGRES_USER}:\${POSTGRES_PASSWORD}@postgres:5432/\${POSTGRES_DB}
SESSION_SECRET=\${SESSION_SECRET}
NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID=\${NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID}
NEXT_PUBLIC_NEW_RELIC_AGENT_ID=\${NEXT_PUBLIC_NEW_RELIC_AGENT_ID}
NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID=\${NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID}
NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY=\${NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY}
NEXT_PUBLIC_NEW_RELIC_TRUST_KEY=\${NEXT_PUBLIC_NEW_RELIC_TRUST_KEY}
ENVEOF
                        """
                    }
                }
            }
        }

        stage('Copy Files to Droplet') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: DROPLET_SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${DROPLET_IP} "mkdir -p ${PRODUCTION_DEPLOY_DIR}"
                        scp -o StrictHostKeyChecking=no -i ${SSH_KEY} docker-compose.yml nginx.conf .env ${SSH_USER}@${DROPLET_IP}:${PRODUCTION_DEPLOY_DIR}/
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${DROPLET_IP} "chmod 600 ${PRODUCTION_DEPLOY_DIR}/.env"
                    '''
                }
            }
        }

        stage('Deploy to Droplet') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: DROPLET_SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER'), string(credentialsId: 'digitalocean_secreat_api_key', variable: 'DO_API_TOKEN')]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${DROPLET_IP} \
                          "echo '${DO_API_TOKEN}' | docker login registry.digitalocean.com -u unused --password-stdin && cd ${PRODUCTION_DEPLOY_DIR} && docker compose pull && docker compose up -d && docker compose exec -T nginx nginx -s reload"
                    '''
                }
            }
        }

        stage('Cleanup Old Images on Droplet') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: DROPLET_SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${DROPLET_IP} "docker image prune -f && docker container prune -f"
                    '''
                }
            }
        }

        stage('Deploy Locally') {
                       when { expression { params.DEPLOY_ENV == 'staging' } }
            steps {
                sh '''
                    mkdir -p ${STAGING_DEPLOY_DIR}
                    cp docker-compose.staging.yml nginx.staging.conf .env.staging ${STAGING_DEPLOY_DIR}/
                    cd ${STAGING_DEPLOY_DIR}
                    # Force-remove any containers from a prior deploy dir/project to avoid fixed-name conflicts.
                    docker rm -f postgres-staging ecommerce-app-staging nginx-proxy-staging 2>/dev/null || true
                    docker compose -f docker-compose.staging.yml --env-file .env.staging up -d
                    docker exec nginx-proxy-staging nginx -s reload
                '''
            }
        }
        }

        stage('Health Check') {
            steps {
                script {
                    sleep(time: 5, unit: 'SECONDS')
                    def healthUrl
                    if (params.DEPLOY_ENV == 'production') {
                        healthUrl = "http://${DROPLET_IP}:80/login"
                    } else {
                        def port = sh(script: "grep '^NGINX_PORT=' ${STAGING_DEPLOY_DIR}/.env.staging | cut -d= -f2-", returnStdout: true).trim()
                        if (!port) {
                            port = '8080'
                        }
                        healthUrl = "http://localhost:${port}/login"
                    }
                    def health = sh(script: "curl -sf ${healthUrl}", returnStatus: true)
                    if (health != 0) {
                        error("Health check failed after ${params.DEPLOY_ENV} deploy")
                    }
                }
            }
        }

        // stage('End-to-End Tests') {
        //     steps {
        //         sh '''
        //             docker run --rm \
        //             --network host \
        //             -e PLAYWRIGHT_BASE_URL=http://${DROPLET_IP}:3000 \
        //             -v ${WORKSPACE}:/app \
        //             -w /app \
        //             mcr.microsoft.com/playwright:v1.62.1-noble \
        //             npm run test:e2e
        //         '''
        //     }
        // }
    }

    post {
        failure {
            script {
                if (params.DEPLOY_ENV == 'production') {
                    withCredentials([sshUserPrivateKey(credentialsId: DROPLET_SSH_CREDENTIALS_ID, keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                        sh 'ssh -o StrictHostKeyChecking=no -i ${SSH_KEY} ${SSH_USER}@${DROPLET_IP} "cd ${PRODUCTION_DEPLOY_DIR} && docker compose logs --tail 50" || true'
                    }
                } else {
                    sh "cd ${STAGING_DEPLOY_DIR} && docker compose -f docker-compose.staging.yml logs --tail 50 || true"
                }
            }
        }
        success {
            echo "Deployed successfully to ${params.DEPLOY_ENV}."
        }
    }
}