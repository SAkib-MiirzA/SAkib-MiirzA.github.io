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
                credentialsId: 'github-jenkins-pat' // optional if repo is private
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

        stage('🌐 Preview Info') {
            steps {
                echo "Your CV site is available at:"
                echo "https://SAkib-MiirzA.github.io/"
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
