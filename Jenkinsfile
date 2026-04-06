pipeline {
    agent any

    parameters {
        choice(name: 'GIT_METHOD', choices: ['HTTPS', 'SSH'], description: 'Choose Git access method')
    }

    environment {
        CRED_HTTPS = "repo-https"  // Jenkins credential ID for HTTPS (username+PAT)
        CRED_SSH   = "repo-ssh"     // Jenkins credential ID for SSH key
        DEPLOY_DIR = "site"         // Folder to prepare website files
        BUILD_TS   = "${new Date().format('yyyyMMdd-HHmmss')}"
    }

    stages {

        stage('📥 Detect Repo URL & Branch') {
            steps {
                script {
                    if (!env.GIT_URL) {
                        error("❌ Jenkinsfile must be loaded from SCM!")
                    }

                    // Determine credentials and URL format
                    if (params.GIT_METHOD == 'HTTPS') {
                        repoUrl = env.GIT_URL.startsWith('git@') ?
                            env.GIT_URL.replaceFirst(/^git@(.*):(.*)$/, 'https://$1/$2') :
                            env.GIT_URL
                        credId = env.CRED_HTTPS
                    } else { // SSH
                        repoUrl = env.GIT_URL.startsWith('https://') ?
                            env.GIT_URL.replaceFirst(/^https:\\/\\/(.*)\\/(.*)\\.git$/, 'git@$1:$2.git') :
                            env.GIT_URL
                        credId = env.CRED_SSH
                    }

                    env.REPO_URL = repoUrl
                    env.CRED_ID  = credId

                    // Detect default branch
                    def defaultBranch = sh(
                        script: """
                        git ls-remote --symref ${repoUrl} HEAD | awk '/^ref:/ {print \$2}' | sed 's|refs/heads/||'
                        """,
                        returnStdout: true
                    ).trim()
                    env.DEFAULT_BRANCH = defaultBranch ?: "main"

                    echo "Repo URL: ${repoUrl}"
                    echo "Default Branch: ${env.DEFAULT_BRANCH}"
                }
            }
        }

        stage('📂 Checkout Repo') {
            steps {
                script {
                    echo "Checking out branch: ${env.DEFAULT_BRANCH}"
                    git branch: "${env.DEFAULT_BRANCH}", url: "${env.REPO_URL}", credentialsId: "${env.CRED_ID}"
                }
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
                sh """
                set -e
                echo "Preparing website files..."
                rm -rf ${DEPLOY_DIR}
                mkdir ${DEPLOY_DIR}

                # Copy all normal files
                cp -r * ${DEPLOY_DIR}/ 2>/dev/null || true

                # Copy hidden files except .git
                for file in .*; do
                    if [ "\$file" != "." ] && [ "\$file" != ".." ] && [ "\$file" != ".git" ]; then
                        cp -r "\$file" ${DEPLOY_DIR}/ 2>/dev/null || true
                    fi
                done

                echo "✅ Website files ready in ${DEPLOY_DIR}"
                """
            }
        }

        stage('🌍 Jenkins HTML Preview') {
            when {
                expression { return env.IS_WEBSITE == "true" }
            }
            steps {
                publishHTML([
                    reportDir: "${DEPLOY_DIR}",
                    reportFiles: "index.html",
                    reportName: 'Website Preview',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('🚀 Deploy to Pages / Docs') {
            steps {
                script {
                    def deployBranch = env.IS_WEBSITE == "true" ?
                                       (env.REPO_URL.contains("github.com") ? "gh-pages" : "pages") :
                                       "docs"

                    echo "Deploying to branch: ${deployBranch}"

                    dir(env.IS_WEBSITE == "true" ? env.DEPLOY_DIR : '.') {

                        if (params.GIT_METHOD == 'SSH') {
                            sh """
                            set -e
                            git init
                            git remote remove origin || true
                            git remote add origin ${env.REPO_URL}

                            git fetch origin ${deployBranch} || true

                            if git show-ref --verify --quiet refs/heads/${deployBranch}; then
                                git checkout ${deployBranch}
                            else
                                git checkout -b ${deployBranch} || git checkout -b ${deployBranch} origin/${deployBranch}
                            fi

                            git config user.email "jenkins@local"
                            git config user.name "Jenkins"

                            git add .
                            git commit -m "🚀 Auto deploy via Jenkins ${BUILD_TS}" || echo "No changes"

                            git push -f origin ${deployBranch}
                            """
                        } else { // HTTPS
                            withCredentials([usernamePassword(
                                credentialsId: env.CRED_ID,
                                usernameVariable: 'USER',
                                passwordVariable: 'TOKEN'
                            )]) {
                                sh """
                                set -e
                                git init
                                git remote remove origin || true
                                git remote add origin https://${USER}:${TOKEN}@${env.REPO_URL.replaceFirst('https://','')}

                                git fetch origin ${deployBranch} || true

                                if git show-ref --verify --quiet refs/heads/${deployBranch}; then
                                    git checkout ${deployBranch}
                                else
                                    git checkout -b ${deployBranch} || git checkout -b ${deployBranch} origin/${deployBranch}
                                fi

                                git config user.email "jenkins@local"
                                git config user.name "Jenkins"

                                git add .
                                git commit -m "🚀 Auto deploy via Jenkins ${BUILD_TS}" || echo "No changes"

                                git push -f origin ${deployBranch}
                                """
                            }
                        }
                    }
                    echo "✅ Deployment Done!"
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

    post {
        failure {
            echo "❌ Pipeline failed! Check the logs for details."
        }
        success {
            echo "🎉 Pipeline succeeded!"
        }
    }
}
