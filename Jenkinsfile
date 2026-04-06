pipeline {
    agent any

    parameters {
        choice(name: 'GIT_METHOD', choices: ['HTTPS', 'SSH'], description: 'Choose Git access method')
    }

    environment {
        CRED_HTTPS = "repo-https"
        CRED_SSH   = "repo-ssh"
        DEPLOY_DIR = "site"
    }

    stages {

        stage('📥 Detect Repo URL') {
            steps {
                script {
                    if (!env.GIT_URL) {
                        error("❌ Jenkinsfile must be loaded from SCM!")
                    }

                    echo "Detected repo: ${env.GIT_URL}"

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
                }
            }
        }

        stage('📂 Checkout Repo') {
            steps {
                git branch: 'main', url: "${env.REPO_URL}", credentialsId: "${env.CRED_ID}"
            }
        }

        stage('📂 Prepare Website Files (No rsync)') {
            steps {
                sh '''
                echo "Preparing site files..."

                rm -rf ${DEPLOY_DIR}
                mkdir ${DEPLOY_DIR}

                # Copy normal files
                cp -r * ${DEPLOY_DIR}/ 2>/dev/null || true

                # Copy hidden files safely
                for file in .*; do
                    if [ "$file" != "." ] && [ "$file" != ".." ] && [ "$file" != ".git" ]; then
                        cp -r "$file" ${DEPLOY_DIR}/ 2>/dev/null || true
                    fi
                done

                # Remove git folder if copied
                rm -rf ${DEPLOY_DIR}/.git

                echo "✅ Files prepared:"
                ls -la ${DEPLOY_DIR}
                '''
            }
        }

        stage('🌐 Detect Entry File') {
            steps {
                script {
                    if (fileExists("${env.DEPLOY_DIR}/index.html")) {
                        env.HTML_FILE = "index.html"
                        echo "✅ index.html found"
                    } else {
                        env.HTML_FILE = ""
                        echo "⚠️ No index.html found"
                    }
                }
            }
        }

        stage('🌍 Jenkins HTML Preview') {
            when {
                expression { return env.HTML_FILE != "" }
            }
            steps {
                publishHTML([
                    reportDir: "${env.DEPLOY_DIR}",
                    reportFiles: "${env.HTML_FILE}",
                    reportName: 'Website Preview',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('🚀 Deploy to Pages') {
            steps {
                script {
                    def branch = ""

                    if (env.REPO_URL.contains("github.com")) {
                        branch = "gh-pages"
                    } else if (env.REPO_URL.contains("gitlab.com")) {
                        branch = "pages"
                    } else {
                        error("❌ Unsupported Git provider")
                    }

                    echo "Deploying to: ${branch}"

                    dir("${env.DEPLOY_DIR}") {
                        withCredentials([usernamePassword(
                            credentialsId: env.CRED_ID,
                            usernameVariable: 'USER',
                            passwordVariable: 'TOKEN'
                        )]) {

                            sh """
                            git init
                            git checkout -b ${branch}

                            git config user.email "jenkins@local"
                            git config user.name "Jenkins"

                            git add .
                            git commit -m "🚀 Auto deploy from Jenkins" || echo "No changes"

                            git push -f ${env.REPO_URL} ${branch}
                            """
                        }
                    }

                    echo "✅ Deployment Done!"
                }
            }
        }

        stage('📦 Archive') {
            steps {
                archiveArtifacts artifacts: '**/*', fingerprint: true
            }
        }

        stage('🎉 Done') {
            steps {
                echo "✅ Full Website Pipeline Completed!"
            }
        }
    }
}
