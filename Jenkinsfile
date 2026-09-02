pipeline {
    agent any

    tools {
        nodejs 'NodeJS-25'
    }

    parameters {
        choice(name: 'DEPLOY_ENV', choices: ['staging', 'production'], description: 'Target environment')
        string(name: 'BRANCH_NAME', defaultValue: 'staging', description: 'Git branch to build')
        string(name: 'STAGING_NGINX_PORT', defaultValue: '8081', description: 'Staging host port')
    }

    environment {
        IMAGE_NAME = 'ecommerce-app'
        REGISTRY = 'registry.digitalocean.com/ecom-next-registry'
        STAGING_DEPLOY_DIR = '/var/lib/jenkins/deployments/ecommerce-app-staging'
        PRODUCTION_DEPLOY_DIR = '/opt/apps/ecommerce-app'
        DROPLET_HOST = credentials('production-droplet-host')
        SESSION_SECRET = credentials('SESSION_SECRET')
        NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID = credentials('new-relic-account-id')
        NEXT_PUBLIC_NEW_RELIC_AGENT_ID = credentials('new-relic-agent-id')
        NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID = credentials('new-relic-application-id')
        NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY = credentials('new-relic-license-key')
        NEXT_PUBLIC_NEW_RELIC_TRUST_KEY = credentials('new-relic-trust-key')
    }

    stages {
        stage('Checkout') {
            steps {
                cleanWs()
                git branch: params.BRANCH_NAME, url: 'https://github.com/sourabhcy/tomato'
                sh 'git log -1 --format="Building commit: %H - %s"'
            }
        }

        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm test -- --ci'
                sh 'npm run lint'
            }
        }

        stage('Build Image') {
            steps {
                script {
                    def image = params.DEPLOY_ENV == 'production'
                        ? "${REGISTRY}/${IMAGE_NAME}:${BUILD_NUMBER}"
                        : "${IMAGE_NAME}:staging"
                    sh """
                        docker build \\
                          --build-arg NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID='${NEXT_PUBLIC_NEW_RELIC_ACCOUNT_ID}' \\
                          --build-arg NEXT_PUBLIC_NEW_RELIC_AGENT_ID='${NEXT_PUBLIC_NEW_RELIC_AGENT_ID}' \\
                          --build-arg NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID='${NEXT_PUBLIC_NEW_RELIC_APPLICATION_ID}' \\
                          --build-arg NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY='${NEXT_PUBLIC_NEW_RELIC_LICENSE_KEY}' \\
                          --build-arg NEXT_PUBLIC_NEW_RELIC_TRUST_KEY='${NEXT_PUBLIC_NEW_RELIC_TRUST_KEY}' \\
                          -t ${image} .
                    """
                    if (params.DEPLOY_ENV == 'production') {
                        sh "docker tag ${image} ${REGISTRY}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }

        stage('Publish Production Image') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([string(credentialsId: 'digitalocean_secreat_api_key', variable: 'DO_API_TOKEN')]) {
                    sh '''
                        printf '%s' "$DO_API_TOKEN" | docker login registry.digitalocean.com -u unused --password-stdin
                        docker push "$REGISTRY/$IMAGE_NAME:$BUILD_NUMBER"
                        docker push "$REGISTRY/$IMAGE_NAME:latest"
                    '''
                }
            }
        }

        stage('Prepare Runtime Environment') {
            steps {
                script {
                    def suffix = params.DEPLOY_ENV == 'production' ? '' : '-staging'
                    def envFile = params.DEPLOY_ENV == 'production' ? '.env' : '.env.staging'
                    def r2Credential = params.DEPLOY_ENV == 'production' ? 'r2-public-base-url-production' : 'r2-public-base-url-staging'
                    def databaseBindings = [
                        string(credentialsId: "postgres-user${suffix}", variable: 'POSTGRES_USER'),
                        string(credentialsId: "postgres-password${suffix}", variable: 'POSTGRES_PASSWORD'),
                        string(credentialsId: "postgres-db${suffix}", variable: 'POSTGRES_DB'),
                        string(credentialsId: r2Credential, variable: 'R2_PUBLIC_BASE_URL')
                    ]
                    withCredentials(databaseBindings) {
                        if (params.DEPLOY_ENV == 'production') {
                            withCredentials([
                                string(credentialsId: 'production-server-name', variable: 'SERVER_NAME'),
                                string(credentialsId: 'production-tls-cert-name', variable: 'TLS_CERT_NAME')
                            ]) {
                                sh "./scripts/write-runtime-env.sh ${envFile}"
                            }
                        } else {
                            withEnv(["NGINX_PORT=${params.STAGING_NGINX_PORT}"]) {
                                sh "./scripts/write-runtime-env.sh ${envFile}"
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy Staging') {
            when { expression { params.DEPLOY_ENV == 'staging' } }
            steps {
                withCredentials([
                    string(credentialsId: 'postgres-user-staging', variable: 'POSTGRES_USER'),
                    string(credentialsId: 'postgres-password-staging', variable: 'POSTGRES_PASSWORD'),
                    string(credentialsId: 'postgres-db-staging', variable: 'POSTGRES_DB'),
                    string(credentialsId: 'r2-public-base-url-staging', variable: 'R2_PUBLIC_BASE_URL')
                ]) {
                    withEnv(["DEPLOY_DIR=${STAGING_DEPLOY_DIR}", "NGINX_PORT=${params.STAGING_NGINX_PORT}", 'SKIP_BUILD=1']) {
                        sh './scripts/deploy-staging.sh'
                    }
                }
            }
        }

        stage('Deploy Production') {
            when { expression { params.DEPLOY_ENV == 'production' } }
            steps {
                withCredentials([sshUserPrivateKey(credentialsId: 'digitalocean-droplet', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER@$DROPLET_HOST" "mkdir -p '$PRODUCTION_DEPLOY_DIR'"
                        scp -o StrictHostKeyChecking=no -i "$SSH_KEY" docker-compose.yml nginx.conf migrations scripts/deploy-production.sh .env "$SSH_USER@$DROPLET_HOST:$PRODUCTION_DEPLOY_DIR/"
                        ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$SSH_USER@$DROPLET_HOST" "chmod 600 '$PRODUCTION_DEPLOY_DIR/.env' && cd '$PRODUCTION_DEPLOY_DIR' && ./deploy-production.sh"
                    '''
                }
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def target = params.DEPLOY_ENV == 'production'
                        ? "http://${DROPLET_HOST}:80/login"
                        : "http://localhost:${params.STAGING_NGINX_PORT}/login"
                    sh "curl --fail --silent --show-error '${target}'"
                }
            }
        }
    }

    post {
        failure {
            echo "Deployment failed for ${params.DEPLOY_ENV}; inspect the Compose logs on the target."
        }
        success {
            echo "Deployed ${params.DEPLOY_ENV} successfully."
        }
    }
}
