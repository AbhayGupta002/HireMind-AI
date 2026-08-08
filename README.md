#  HireMe AI (TalentIQ) — Next-Gen AI Recruitment & Talent Intelligence Platform

[![Build Status](https://img.shields.io/badge/Build-Passing-emerald?style=for-the-badge&logo=github)](https://github.com/AbhayGupta002/HireMind-AI)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen?style=for-the-badge&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=for-the-badge&logo=mysql)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

**HireMind AI** (formerly TalentIQ) is an enterprise-grade, full-stack AI recruitment intelligence platform designed to streamline hiring workflows, compute candidate-to-job match scores, parse resumes, provide RAG-powered HR AI interview assistance, and automate applicant notifications.

---

## Key Features

### 🏢 HR Recruiter Portal
-  **Live Job Publishing**: Post, edit, and publish technical job opportunities with customizable skill tags, experience levels, and salary ranges.
-  **Applicant Review & Resume Downloader**: View submitted candidate profiles, cover letters, and download original candidate resume PDFs (`.pdf`, `.docx`).
-  **Hiring Funnel Stage Pipeline**: Move candidates through recruitment stages (`APPLIED` ➔ `SCREENED` ➔ `INTERVIEWING` ➔ `OFFERED` ➔ `REJECTED`) with automatic candidate notifications.
-  **RAG HR AI Copilot**: Generate tailored interview questions, evaluate technical competencies, and synthesize candidate summaries in real time.
-  **Recruiter Telemetry & Analytics**: Stage-by-stage funnel conversion rates, average time-to-hire, and active job telemetry.

###  Candidate Applicant Portal
- ⚡ **AI Match Scoring**: Algorithmic fit analysis (0–100%) comparing candidate profile skills against active job requirements.
-  **Resume Parser**: Automatic extraction of technical skills, experience history, and education details.
-  **Interactive Portfolio Showcase**: Create and highlight project demos, GitHub repositories, and live URLs.
-  **Application Tracker**: Monitor application status changes and receive real-time recruiter notifications.

###  Security & Infrastructure
-  **Spring Security 6 & JWT**: Stateless token authentication with BCrypt strength 12 password hashing.
-  **Brute-Force & Lockout Protection**: Automatic 15-minute account lockout after 5 consecutive failed login attempts.
-  **Redis Cache & Rate Limiting**: Distributed session caching and sliding window rate limiting for public endpoints.
-  **Flyway Schema Versioning**: Automated database migration pipeline (`V1` through `V11`).

---

##  Technology Stack

| Layer | Technologies & Tools |
|---|---|
| **Backend Framework** | Java 17, Spring Boot 3.3.4, Spring Security 6, Spring Data JPA, Hibernate |
| **Database & Caching** | MySQL 8.0 (Dev/Prod), H2 (In-Memory Testing), Redis 7.0, Flyway Migrations |
| **Frontend Framework** | React 18, TypeScript, Vite 8, Lucide React Icons, Axios |
| **AI & Automation** | RAG Pipeline, Vector Embeddings, Spring AI / OpenAI Integration |
| **Build Tools** | Apache Maven 3.9+, Node.js 20+, npm |

---

##  Quick Start & Local Setup

### 1. Prerequisites
Ensure you have the following installed locally:
- **Java JDK 17+**
- **Node.js 20+** & **npm**
- **MySQL 8.0+** running on `localhost:3306`
- **Redis Server** running on `localhost:6379`

---

### 2. Database Provisioning
Connect to your local MySQL instance and create the application databases:

```sql
CREATE DATABASE IF NOT EXISTS talentiq_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS talentiq_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'talentiq'@'localhost' IDENTIFIED BY 'TalentIQ@2024!';
GRANT ALL PRIVILEGES ON talentiq_dev.* TO 'talentiq'@'localhost';
GRANT ALL PRIVILEGES ON talentiq_test.* TO 'talentiq'@'localhost';
FLUSH PRIVILEGES;
```

---

### 3. Backend Setup (`talentiq-backend`)

1. Navigate to the backend directory:
   ```bash
   cd talentiq-backend
   ```

2. Update database credentials in `src/main/resources/application-dev.yml` (if using a custom MySQL root password):
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/talentiq_dev?useSSL=false&allowPublicKeyRetrieval=true
       username: root
       password: YOUR_LOCAL_MYSQL_PASSWORD
   ```

3. Compile and launch the Spring Boot application:
   ```bash
   mvn clean spring-boot:run -Dspring-boot.run.jvmArguments="-Dspring.profiles.active=dev"
   ```
   *The backend REST API will start on `http://localhost:8080/api`.*

---

### 4. Frontend Setup (`talentiq-frontend`)

1. Navigate to the frontend directory:
   ```bash
   cd talentiq-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The web app will open at `http://localhost:3000` with automated proxying to the backend API.*

---

## 🔑 Quick Demo Login Credentials

You can test the application immediately using the pre-configured role switcher on the login page (`http://localhost:3000/login`):

| Role | Email | Password | Access Scope |
|---|---|---|---|
| 🎯 **Candidate** | `candidate@example.com` | `Password123!` | Job Search, AI Matches, Application Tracking, Portfolio |
| 🏢 **HR Recruiter** | `hr@techcorp.com` | `Password123!` | Job Posting Modal, Candidate Applicants, Resume Download, HR Copilot |
| 🛡️ **Super Admin** | `admin@talentiq.ai` | `Admin@123!` | Platform Metrics, User Lockouts, Corporate Verification |

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/v1/auth/register` | Register new Candidate or HR Recruiter account | Public |
| `POST` | `/v1/auth/login` | Authenticate user and issue JWT access & refresh tokens | Public |
| `GET` | `/v1/users/me` | Fetch authenticated user profile details | Bearer JWT |
| `GET` | `/v1/jobs` | Search & list active job postings | Public |
| `POST` | `/v1/jobs` | Publish a new job posting | HR Only |
| `GET` | `/v1/applications/hr` | List candidate applicants for HR recruiter's company | HR Only |
| `PUT` | `/v1/applications/{id}/status` | Update application status (`SCREENED`, `INTERVIEWING`, etc.) | HR Only |
| `GET` | `/v1/resumes/{id}` | Download candidate resume PDF | Authenticated |
| `GET` | `/v1/recommendations/matches` | Get AI-matched jobs for authenticated candidate | Candidate Only |
| `POST` | `/v1/copilot/chat` | Send prompt to RAG-powered HR AI Copilot | HR Only |

---

##  Running Automated Tests

Execute backend integration tests using the isolated H2 in-memory profile:

```bash
cd talentiq-backend
mvn clean test
```

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

###  Developed & Maintained by
**Abhay Gupta** — [GitHub Profile](https://github.com/AbhayGupta002)
