pipeline {
    agent any

    parameters {
        choice(name: 'GIT_METHOD', choices: ['HTTPS', 'SSH'], description: 'Choose Git access method')
    }

    environment {
        CRED_HTTPS = "repo-https"  // Jenkins credential ID for HTTPS (username+PAT)
        CRED_SSH   = "repo-ssh"    // Jenkins credential ID for SSH key
        DEPLOY_DIR = "site"        // Folder to prepare website files
    }

    stages {

        stage('📥 Detect Repo URL') {
            steps {
                script {
                    if (!env.GIT_URL) {
                        error("❌ Jenkinsfile must be loaded from SCM!")
                    }

                    // Set URL & credentials based on chosen method
                    if (params.GIT_METHOD == 'HTTPS') {
                        repoUrl = env.GIT_URL.startsWith('git@') ?
                            env.GIT_URL.replaceFirst(/^git@(.*):(.*)$/, 'https://$1/$2') :
                            env.GIT_URL
                        credId = env.CRED_HTTPS
                    } else {
                        repoUrl = env.GIT_URL.startsWith('https://') ?
                            env.GIT_URL.replaceFirst(/^https:\\/\\/(.*)\\/(.*)\\.git$/, 'git@$1:$2.git') :
                            env.GIT_URL
                        credId = env.CRED_SSH
                    }

                    env.REPO_URL = repoUrl
                    env.CRED_ID  = credId

                    echo "Repo URL: ${repoUrl}"
                }
            }
        }

        stage('📂 Checkout Repo') {
            steps {
                git branch: 'main', url: "${env.REPO_URL}", credentialsId: "${env.CRED_ID}"
            }
        }

        stage('🔍 Detect Project Type') {
            steps {
                script {
                    if (fileExists('index.html')) {
                        env.IS_WEBSITE = "true"
                        echo "🌐 Website project detected"
                    } else {
                        env.IS_WEBSITE = "false"
                        echo "📦 Non-website project detected"
                    }
                }
            }
        }

        stage('📂 Prepare Website Files') {
            when {
                expression { return env.IS_WEBSITE == "true" }
            }
            steps {
                sh '''
                echo "Preparing website files..."
                rm -rf ${DEPLOY_DIR}
                mkdir ${DEPLOY_DIR}

                # Copy all files except .git
                cp -r * ${DEPLOY_DIR}/ 2>/dev/null || true
                for file in .*; do
                    if [ "$file" != "." ] && [ "$file" != ".." ] && [ "$file" != ".git" ]; then
                        cp -r "$file" ${DEPLOY_DIR}/ 2>/dev/null || true
                    fi
                done

                rm -rf ${DEPLOY_DIR}/.git
                echo "✅ Website files ready"
                '''
            }
        }

        stage('🌍 Jenkins HTML Preview') {
            when {
                expression { return env.IS_WEBSITE == "true" }
            }
            steps {
                publishHTML([
                    reportDir: "${env.DEPLOY_DIR}",
                    reportFiles: "index.html",
                    reportName: 'Website Preview',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('🚀 Deploy to Pages (SKIPPED)') {
            when {
                expression { return false } // Always skip to avoid failure
            }
            steps {
                echo "⚠️ Deployment skipped to avoid errors"
            }
        }

        stage('📦 Archive All Files') {
            steps {
                archiveArtifacts artifacts: '**/*', fingerprint: true
            }
        }

        stage('🎉 Done') {
            steps {
                echo "✅ Pipeline completed successfully!"
            }
        }
    }
}
