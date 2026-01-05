# 📚 Study Tracker

A full-stack web application designed to help students track their study hours, analyze their performance, and predict future grades. Built with a **Java Spring Boot** backend and a **React.js** frontend, stored in **MongoDB**.

## ✨ Features

### ⏱️ Study Tracking
* **Real-time Timer:** Stopwatch to track live study sessions for specific classes.
* **Session History:** Detailed logs of start times, end times, and durations.
* **Subject Totals:** At-a-glance view of total hours dedicated to each subject.

### 📊 Analytics Dashboard
* **Data Visualization:** Interactive graphs built with Recharts.
* **Correlation Analysis:** Scatter charts visualizing the relationship between **Time Studied** and **Grades Achieved**.
* **Efficiency Metrics:** Bar charts displaying "Points per Hour" to help identify which subjects you are most efficient in.
* **KPIs:** Key Performance Indicators like Average Efficiency.

### 🧮 Predictive Grade Calculator
* **Goal Setting:** Enter a target grade (e.g., 90%) to calculate exactly what score you need on remaining exams.
* **Time Prediction Engine:** Uses linear regression on your past data to predict **how many hours** you need to study to achieve your target score.
* **Custom Scenarios:** Add hypothetical grades to see how they impact your overall average (Normalized and Absolute).
* **Dynamic Configuration:** Create custom assignment types (e.g., Labs, Quizzes, Projects) and assign specific weights.

### 🗂️ Class & Semester Management
* **Semester Tabs:** Organize classes by semester with Archive/Unarchive functionality.
* **Customizable Classes:** Add/Delete subjects and configure unique grading scales for each.
* **Assignment Sync:** Assignments added in the Calculator automatically sync to your Tracker.

## 🛠️ Tech Stack

### **Backend**
* **Java 17+**
* **Spring Boot 3+** (Web, Data MongoDB, Lombok)
* **MongoDB** (Database)
* **Maven** (Build Tool)

### **Frontend**
* **React.js** (Hooks, Functional Components)
* **Recharts** (Data Visualization & Graphs)
* **CSS3** (Flexbox, Grid, Animations)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project running on your local machine.

### **Prerequisites**
* [Java JDK 17](https://www.oracle.com/java/technologies/downloads/) or higher
* [Node.js & npm](https://nodejs.org/)
* [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on port 27017)

### **1. Setup the Backend**

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Ensure your local MongoDB service is running.
3.  Run the Spring Boot application:
    ```bash
    ./mvnw spring-boot:run
    ```
    *The server will start on `http://localhost:8080`.*

### **2. Setup the Frontend**

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the React application:
    ```bash
    npm start
    ```
    *The client will open on `http://localhost:3000`.*

---

## 📂 Project Structure

```text
StudyTracker/
├── backend/
│   ├── src/main/java/com/example/studytracker/
│   │   ├── StudyTrackerApplication.java  # Entry Point
│   │   ├── controller/                   # REST Controllers (API Endpoints)
│   │   ├── model/                        # MongoDB Documents (Subject, Session, GradeEntry)
│   │   └── repository/                   # Data Access Layer
│   └── pom.xml
│
└── frontend/
    ├── src/
    │   ├── App.js                        # Main UI Logic & Dashboard
    │   ├── App.css                       # Styling
    │   └── index.js
    └── package.json
---

## 🔌 API Endpoints 
The backend exposes the following RESTful endpoints:

### **Semesters**
* GET /api/semesters - Get all semesters.
* OST /api/semesters - Create a new semester.
* PUT /api/semesters/{id} - Update a semester (e.g., Archive/Unarchive).
* DELETE /api/semesters/{id} - Delete a semester.

### **Subjects**
* GET /api/subjects?semesterId={id} - Get subjects for a specific semester.
* POST /api/subjects - Add a subject.
* PUT /api/subjects/{id}/config - Update grading weights and assignment types.
* DELETE /api/subjects/{id} - Delete a subject.

### **Sessions**
* GET /api/sessions?semesterId={id} - Get study history for a semester.
* POST /api/sessions - Log a new study session.
* POST /api/assessments - Add a graded assessment.
* GET /api/grades - Get grade entries for the calculator.