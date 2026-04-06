pipeline {
    agent any

    environment {
        USER_NAME = "SAkib"
        REPO_URL = "https://github.com/SAkib-MiirzA/SAkib-MiirzA.github.io.git"
    }

    stages {

        stage('📥 Checkout CV Repo') {
            steps {
                git branch: 'main',
                url: "${REPO_URL}",
                credentialsId: 'github-jenkins-pat' // remove if repo is public
            }
        }

        stage('📂 Verify Files') {
            steps {
                sh '''
                echo "Checking project files..."
                ls -la

                if [ ! -f index.html ]; then
                    echo "❌ index.html not found!"
                    exit 1
                fi

                echo "✅ index.html found!"
                '''
            }
        }

        stage('🌐 Show Links') {
            steps {
                script {
                    // Safe way to get IP (no awk, no $ issue)
                    def ip = sh(script: "hostname -I", returnStdout: true).trim().split()[0]

                    echo "======================================"
                    echo "🌍 GitHub Pages:"
                    echo "https://SAkib-MiirzA.github.io/"

                    echo "🖥️ Jenkins HTML Preview:"
                    echo "${env.BUILD_URL}HTML_20Report/"

                    echo "🌐 Server (if deployed):"
                    echo "http://${ip}"
                    echo "======================================"
                }
            }
        }

        stage('🌍 Publish HTML Report') {
            steps {
                publishHTML([
                    reportDir: '.',
                    reportFiles: 'index.html',
                    reportName: 'HTML Report',
                    keepAll: true,
                    alwaysLinkToLastBuild: true,
                    allowMissing: false
                ])
            }
        }

        stage('📦 Archive Website') {
            steps {
                archiveArtifacts artifacts: '**/*', fingerprint: true
            }
        }

        stage('🎉 Done') {
            steps {
                echo "✅ CV Pipeline executed successfully!"
            }
        }
    }
}
