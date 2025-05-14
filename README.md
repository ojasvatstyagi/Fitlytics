# 🏅 IRON TRACKER: AWS-Powered Fitness Logging App

A secure, intelligent, and serverless fitness application built using ReactJS for the frontend and **9 AWS Free Tier services** in the backend.

---

## 🔍 Features

- **User sign-up/sign-in with AWS Cognito**
- Securely log, edit, view, and delete workouts
- Get smart insights with AI chatbot (OpenAI + Lambda)
- AI-generated workout summaries translated to local languages using Amazon Translate
- Hear responses aloud using Amazon Polly
- Email notifications via SNS when workouts are saved
- Data stored in DynamoDB
- REST API using API Gateway + Lambda
- Monitoring via CloudWatch Logs

---

## 🏠 Hosted Frontend

**Live App:** [https://main.abcxyz123.amplifyapp.com](https://main.abcxyz123.amplifyapp.com)

---

## ⚙️ Tech Stack

### Frontend

- ReactJS
- Axios
- Toastify for alerts

### Backend

| AWS Service | Purpose                            |
| ----------- | ---------------------------------- |
| Cognito     | User Auth (Sign-up, Sign-in)       |
| Lambda (x5) | Business logic functions           |
| DynamoDB    | Workout data storage               |
| API Gateway | REST API for frontend              |
| SNS         | Email notifications                |
| CloudWatch  | Logging for Lambda                 |
| Translate   | Language translation (e.g., Hindi) |
| Polly       | Text-to-speech audio               |

---

## ✅ Setup Instructions

1. **Clone the Repo**
   ```
   git clone https://github.com/your-username/fitness-tracker-app.git
   cd fitness-tracker-app
   ```
2. **Install Packages**
   ```
   npm install
   ```
3. **Create `.env` File**
   ```
   REACT_APP_CLIENT_ID=your-cognito-app-client-id
   REACT_APP_COGNITO_REGION=us-east-1
   REACT_APP_API_BASE=https://your-api-id.execute-api.us-east-1.amazonaws.com/workoutStage1
   REACT_APP_CHATBOT_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/workoutStage1/analyzeWorkouts
   ```
4. **Run Locally**
   ```
   npm start
   ```
5. **Build for Production**
   ```
   npm run build
   ```
   Deploy the `build` folder to AWS Amplify or Firebase.

---

## ⚡ Demo Walkthrough

1. Register new user
2. Log in with Cognito
3. Log new workout → SNS email alert
4. View/edit/delete workout from history
5. Open AI Assistant → Ask questions
6. Translate and hear insights (Translate + Polly)

---

## 📚 Architecture Overview
