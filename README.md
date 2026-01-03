# 📚 Study Tracker

A full-stack web application designed to help students track their study hours across multiple semesters and subjects. Built with a **Java Spring Boot** backend and a **React.js** frontend, stored in **MongoDB**.

## ✨ Features

* **Semester Management:** Create distinct tabs for different semesters to organize your academic year.
* **Archiving System:** Archive old semesters to keep the workspace clean without deleting historical data.
* **Class Management:** Add and delete classes (subjects) specific to the selected semester.
* **Study Timer:** Real-time stopwatch to track study sessions.
* **Session History:** View a log of start times, end times, and durations for every session.
* **Analytics Sidebar:** Real-time summary showing total study time per subject and the semester total.
* **Data Persistence:** All data is securely stored in a MongoDB database.

## 🛠️ Tech Stack

### **Backend**
* **Java 17+**
* **Spring Boot 3+** (Web, Data MongoDB, Lombok)
* **MongoDB** (Database)
* **Maven** (Build Tool)

### **Frontend**
* **React.js** (Hooks, Functional Components)
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
│   │   ├── model/                        # MongoDB Documents (Semester, Subject, Session)
│   │   └── repository/                   # Data Access Layer
│   └── pom.xml
│
└── frontend/
    ├── src/
    │   ├── App.js                        # Main UI Logic
    │   ├── App.css                       # Styling
    │   └── index.js
    └── package.json

---

##🔌 API Endpoints 
The backend exposes the following RESTful endpoints:

### **Semesters**
*GET /api/semesters - Get all semesters.
*POST /api/semesters - Create a new semester.
*PUT /api/semesters/{id} - Update a semester (e.g., Archive/Unarchive).
*DELETE /api/semesters/{id} - Delete a semester.