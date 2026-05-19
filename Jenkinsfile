pipeline {
    agent any

    environment {
        PYTHON_APP = "app.py"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Setup') {
            steps {
                sh 'python -m venv venv'
                sh './venv/bin/pip install -r requirements.txt'
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Backend Lint') {
                    steps {
                        sh './venv/bin/flask --app app run --help' // Simple smoke test
                    }
                }
                stage('Frontend Lint') {
                    steps {
                        dir('frontend') {
                            sh 'npm run lint-check'
                        }
                    }
                }
            }
        }

        stage('Archive') {
            steps {
                archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
