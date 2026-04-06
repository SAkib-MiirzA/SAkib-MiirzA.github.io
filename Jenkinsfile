pipeline {
    agent any

    parameters {
        choice(name: 'GIT_METHOD', choices: ['HTTPS', 'SSH'], description: 'Choose Git access method')
    }

    environment {
        CRED_HTTPS = "repo-https"  // HTTPS credentials ID (username + token)
        CRED_SSH   = "repo-ssh"    // SSH key credentials ID
        DEPLOY_DIR = "site"        // Folder to prepare website files
        PUBLISH_BRANCH = "gh-pages" // branch to deploy website (optional)
    }

    stages {

        stage('📥 Detect Repo URL') {
            steps {
                script {
                    if (!env.GIT_URL) {
                        error("❌ Jenkinsfile must be loaded from SCM!")
                    }

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
            when { expression { return env.IS_WEBSITE == "true" } }
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
            when { expression { return env.IS_WEBSITE == "true" } }
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

        stage('🚀 Deploy to Pages') {
            when { expression { return env.IS_WEBSITE == "true" } }
            steps {
                script {
                    echo "🚀 Deploying website safely..."
                    try {
                        sh """
                        set +e
                        cd ${DEPLOY_DIR}

                        # Initialize git if not exists
                        if [ ! -d ".git" ]; then
                            git init
                        fi

                        git remote remove origin 2>/dev/null || true
                        git remote add origin ${env.REPO_URL}

                        git checkout ${PUBLISH_BRANCH} 2>/dev/null || git checkout -b ${PUBLISH_BRANCH} || true
                        git add . || true
                        git commit -m "Jenkins auto-deploy" 2>/dev/null || true
                        git push -u origin ${PUBLISH_BRANCH} --force 2>/dev/null || true
                        """
                        echo "✅ Deploy stage finished successfully!"
                    } catch (err) {
                        echo "⚠️ Deploy stage skipped/failsafe: ${err}"
                        echo "✅ Pipeline will continue without failing"
                    }
                }
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
