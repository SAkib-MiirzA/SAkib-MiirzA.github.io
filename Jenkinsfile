pipeline {
    agent any

    parameters {
        choice(name: 'GIT_METHOD', choices: ['HTTPS', 'SSH'], description: 'Choose Git access method')
    }

    environment {
        CRED_HTTPS = "repo-https"  // Username + PAT
        CRED_SSH   = "repo-ssh"    // SSH private key
    }

    stages {

        stage('📥 Detect Repo URL') {
            steps {
                script {
                    if (!env.GIT_URL) {
                        error("❌ Cannot detect repo URL. Jenkinsfile must be loaded from SCM.")
                    }

                    echo "Detected repository URL: ${env.GIT_URL}"

                    if (params.GIT_METHOD == 'HTTPS') {
                        repoUrl = env.GIT_URL.startsWith('git@') ? env.GIT_URL.replaceFirst(/^git@(.*):(.*)$/, 'https://$1/$2') : env.GIT_URL
                        credId = env.CRED_HTTPS
                    } else {
                        repoUrl = env.GIT_URL.startsWith('https://') ? env.GIT_URL.replaceFirst(/^https:\\/\\/(.*)\\/(.*)\\.git$/, 'git@$1:$2.git') : env.GIT_URL
                        credId = env.CRED_SSH
                    }

                    echo "Using URL: ${repoUrl}"
                    echo "Using Credential ID: ${credId}"

                    env.REPO_URL = repoUrl
                    env.CRED_ID = credId
                }
            }
        }

        stage('📂 Checkout Repo') {
            steps {
                git branch: 'main', url: "${env.REPO_URL}", credentialsId: "${env.CRED_ID}"
            }
        }

        stage('📂 Verify Files') {
            steps {
                script {
                    def htmlFile = ""
                    if (fileExists('index.html')) {
                        htmlFile = "index.html"
                        echo "✅ Found index.html"
                    } else if (fileExists('README.md')) {
                        htmlFile = "README.md"
                        echo "✅ Found README.md"
                    } else {
                        echo "❌ No HTML or README file found!"
                    }
                    env.HTML_FILE = htmlFile
                }
            }
        }

        stage('🌍 Publish HTML Preview in Jenkins') {
            when {
                expression { return env.HTML_FILE != "" }
            }
            steps {
                publishHTML([
                    reportDir: '.',
                    reportFiles: "${env.HTML_FILE}",
                    reportName: 'HTML Preview',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('🚀 Deploy to Pages') {
            when {
                expression { return env.HTML_FILE != "" }
            }
            steps {
                script {
                    def branch = ""
                    if (env.REPO_URL.contains("github.com")) {
                        branch = "gh-pages"
                    } else if (env.REPO_URL.contains("gitlab.com")) {
                        branch = "pages"
                    } else {
                        error("Unknown Git host. Cannot deploy Pages.")
                    }

                    echo "Deploying to branch: ${branch}"

                    withCredentials([usernamePassword(credentialsId: env.CRED_ID, usernameVariable: 'USER', passwordVariable: 'TOKEN')]) {
                        sh """
                            git checkout --orphan ${branch} || git checkout ${branch}
                            git --work-tree=. add -f .
                            git --work-tree=. commit -m "Jenkins auto-deploy"
                            git push -f ${env.REPO_URL} HEAD:${branch}
                            git checkout main
                        """
                    }

                    echo "✅ Deployment completed!"
                }
            }
        }

        stage('📦 Archive Repo') {
            steps {
                archiveArtifacts artifacts: '**/*', fingerprint: true
            }
        }

        stage('🎉 Done') {
            steps {
                echo "✅ Pipeline executed successfully!"
            }
        }
    }
}
