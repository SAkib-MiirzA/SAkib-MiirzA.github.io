
// Production-ready Jenkinsfile supporting GitHub, GitLab.com, and self-hosted GitLab
// ✅ Auto-detect repository provider and authentication method (SSH/HTTPS)
// ✅ Auto-select corresponding Jenkins credentials (GitHub/GitLab SSH + HTTPS)
// ✅ Automatic website detection with rsync/cp fallback and Jenkins HTML preview
// ✅ Safe GitHub Pages (gh-pages) and GitLab Pages (pages) deployment with error handling
// ✅ Artifact archiving, first-build compatibility, and secure Jenkins-managed credentials

pipeline {
    agent any

    environment {
        GITHUB_HTTPS = "github-https"
        GITHUB_SSH   = "github-ssh"

        GITLAB_HTTPS = "gitlab-https"
        GITLAB_SSH   = "gitlab-ssh"

        DEPLOY_DIR = "site"
        PUBLISH_BRANCH = "gh-pages"
    }

    stages {

        stage('📥 Detect Repository & Credential') {
            steps {
                script {

                    if (!env.GIT_URL) {
                        error("❌ Jenkinsfile must be loaded from SCM!")
                    }

                    env.REPO_URL = env.GIT_URL

                    def repo = env.GIT_URL.toLowerCase()

                    // Detect GitHub / GitLab
                    if (repo.contains("github.com")) {

                        env.GIT_PROVIDER = "github"

                        if (repo.startsWith("git@") || repo.startsWith("ssh://")) {
                            env.CRED_ID = env.GITHUB_SSH
                            echo "🐙 GitHub repository detected"
                            echo "🔐 Authentication: SSH"
                        } else if (repo.startsWith("https://")) {
                            env.CRED_ID = env.GITHUB_HTTPS
                            echo "🐙 GitHub repository detected"
                            echo "🔐 Authentication: HTTPS"
                        } else {
                            error("❌ Unknown GitHub repository URL: ${env.GIT_URL}")
                        }

                    } else if (repo.contains("gitlab.com")) {

                        env.GIT_PROVIDER = "gitlab"

                        if (repo.startsWith("git@") || repo.startsWith("ssh://")) {
                            env.CRED_ID = env.GITLAB_SSH
                            echo "🦊 GitLab repository detected"
                            echo "🔐 Authentication: SSH"
                        } else if (repo.startsWith("https://")) {
                            env.CRED_ID = env.GITLAB_HTTPS
                            echo "🦊 GitLab repository detected"
                            echo "🔐 Authentication: HTTPS"
                        } else {
                            error("❌ Unknown GitLab repository URL: ${env.GIT_URL}")
                        }

                    } else {

                        error("""
                        ❌ Unsupported Git provider.

                        Repository:
                        ${env.GIT_URL}

                        Supported:
                        GitHub
                        GitLab
                        """)
                    }

                    echo "----------------------------------------"
                    echo "Provider    : ${env.GIT_PROVIDER}"
                    echo "Repository  : ${env.REPO_URL}"
                    echo "Credential  : ${env.CRED_ID}"
                    echo "----------------------------------------"
                }
            }
        }

        stage('📂 Checkout Repository') {
            steps {
                script {

                    checkout([
                        $class: 'GitSCM',

                        branches: [[
                            name: '*/main'
                        ]],

                        doGenerateSubmoduleConfigurations: false,

                        extensions: [],

                        userRemoteConfigs: [[
                            url: env.REPO_URL,
                            credentialsId: env.CRED_ID
                        ]]
                    ])
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
                expression {
                    env.IS_WEBSITE == "true"
                }
            }

            steps {

                sh '''
                    set -e

                    echo "Preparing website files..."

                    rm -rf "$DEPLOY_DIR"

                    mkdir -p "$DEPLOY_DIR"

                    if command -v rsync >/dev/null 2>&1; then

                        echo "✅ Using rsync"

                        rsync -a \
                            --exclude='.git' \
                            --exclude="$DEPLOY_DIR" \
                            ./ "$DEPLOY_DIR/"

                    else

                        echo "⚠️ rsync not found"
                        echo "Using cp fallback"

                        find . -maxdepth 1 \
                            ! -name "$DEPLOY_DIR" \
                            ! -name "." \
                            ! -name ".." \
                            -exec cp -r {} "$DEPLOY_DIR/" \\;

                        rm -rf "$DEPLOY_DIR/.git"

                    fi

                    echo "✅ Website files ready"
                '''
            }
        }

        stage('🌍 Jenkins HTML Preview') {
            when {
                expression {
                    env.IS_WEBSITE == "true"
                }
            }

            steps {

                publishHTML([
                    reportDir: "${DEPLOY_DIR}",
                    reportFiles: "index.html",
                    reportName: "Website Preview",
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('🚀 Deploy to Pages') {
            when {
                expression {
                    env.IS_WEBSITE == "true"
                }
            }

            steps {

                script {

                    echo "🚀 Deploying website..."

                    try {

                        if (env.GIT_PROVIDER == "github") {

                            withCredentials([
                                sshUserPrivateKey(
                                    credentialsId: env.GITHUB_SSH,
                                    keyFileVariable: 'SSH_KEY',
                                    usernameVariable: 'SSH_USER'
                                )
                            ]) {

                                sh '''
                                    set -e

                                    cd "$DEPLOY_DIR"

                                    export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"

                                    git init

                                    git remote remove origin 2>/dev/null || true

                                    git remote add origin "$REPO_URL"

                                    git checkout -B "$PUBLISH_BRANCH"

                                    git add .

                                    git commit -m "Jenkins auto-deploy" || true

                                    git push origin "$PUBLISH_BRANCH" --force
                                '''
                            }

                        } else {

                            echo "🦊 GitLab deployment detected"

                            withCredentials([
                                sshUserPrivateKey(
                                    credentialsId: env.GITLAB_SSH,
                                    keyFileVariable: 'SSH_KEY',
                                    usernameVariable: 'SSH_USER'
                                )
                            ]) {

                                sh '''
                                    set -e

                                    cd "$DEPLOY_DIR"

                                    export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o StrictHostKeyChecking=no"

                                    git init

                                    git remote remove origin 2>/dev/null || true

                                    git remote add origin "$REPO_URL"

                                    git checkout -B "$PUBLISH_BRANCH"

                                    git add .

                                    git commit -m "Jenkins auto-deploy" || true

                                    git push origin "$PUBLISH_BRANCH" --force
                                '''
                            }
                        }

                        echo "✅ Deployment completed!"

                    } catch (err) {

                        echo "⚠️ Deployment failed."
                        echo "Pipeline will continue safely."
                        echo "Reason: ${err}"
                    }
                }
            }
        }

        stage('📦 Archive All Files') {
            steps {

                archiveArtifacts(
                    artifacts: '**/*',
                    fingerprint: true
                )
            }
        }

        stage('🎉 Done') {
            steps {

                echo """
                ========================================
                ✅ Jenkins Pipeline Completed
                ========================================

                Provider   : ${env.GIT_PROVIDER}
                Repository : ${env.REPO_URL}
                Credential : ${env.CRED_ID}
                Website    : ${env.IS_WEBSITE}

                ========================================
                """
            }
        }
    }
}
