
# QuantumFusion Solutions: Backend API Requirements Guide

This document outlines the high-level requirements for a backend system designed to support the QuantumFusion Solutions Next.js frontend application. This guide is technology-agnostic in terms of backend implementation (e.g., Java Spring Boot, Node.js/Express, Python/Django) but focuses on the functionalities and API endpoints the frontend would expect.

## I. Core Goals

1.  **User Authentication & Management**: Securely manage user accounts, registration, login, and password recovery.
2.  **User Profile Management**: Allow users to create, view, and update their profiles.
3.  **Job Application System**: Enable users to apply for jobs and store application data.
4.  **Data Persistence**: Store all relevant data (users, profiles, applications) in a database.
5.  **Email Notifications**: Send transactional emails for OTP verification, signup confirmation, application confirmation, and password resets.
6.  **(Optional Advanced) Job Match Alerts**: Logic to notify users about relevant new jobs.

## II. Data Models (Conceptual)

The backend will need to manage the following primary data entities. Database schema design will depend on the chosen database technology.

### 1. User
   - `userId` (String, Primary Key, Unique)
   - `fullName` (String)
   - `email` (String, Unique, Indexed)
   - `hashedPassword` (String) - Never store plain text passwords.
   - `emailVerified` (Boolean, default: false)
   - `createdAt` (Timestamp)
   - `updatedAt` (Timestamp)

### 2. UserProfile
   - `profileId` (String, Primary Key, Unique) - Can be same as `userId`.
   - `userId` (String, Foreign Key to User)
   - `phone` (String, Optional)
   - `skills` (Array of Strings, Optional)
   - `resumeUrl` (String, URL, Optional) - Link to a resume hosted elsewhere.
   - `codingProfileUrl` (String, URL, Optional)
   - `linkedinProfile` (String, URL, Optional)
   - `portfolioWebsite` (String, URL, Optional)
   - `preferredJobLocation` (String, Optional)
   - `currentCTC` (String, Optional)
   - `expectedSalary` (String, Optional)
   - `noticePeriod` (String, Optional)
   - `jobNotificationOptIn` (Boolean, default: false)
   - `updatedAt` (Timestamp)

### 3. OTP (One-Time Password)
   - `otpId` (String, Primary Key)
   - `userId` (String, Foreign Key to User, or email if user not yet created)
   - `otpCode` (String, Hashed or Encrypted)
   - `expiresAt` (Timestamp)
   - `used` (Boolean, default: false)
   - `purpose` (String, e.g., "EMAIL_VERIFICATION", "PASSWORD_RESET")

### 4. JobApplication
   - `applicationId` (String, Primary Key, Unique)
   - `userId` (String, Foreign Key to User)
   - `jobId` (String) - Referring to the ID of the job (from `dummyJobs` or a future Jobs table)
   - `jobTitle` (String)
   - `fullName` (String) - At time of application
   - `email` (String) - At time of application
   - `phone` (String) - At time of application
   - `resumeFileName` (String) - If a file is uploaded to backend storage.
   - `resumeStoragePath` (String, Optional) - Path in backend storage if resume files are stored.
   - `linkedinProfile` (String, URL, Optional)
   - `portfolioWebsite` (String, URL, Optional)
   - `codingProfileUrl` (String, URL, Optional)
   - `highestQualification` (String)
   - `specialization` (String)
   - `university` (String)
   - `passingYear` (String)
   - `marks` (String)
   - `primarySkills` (String) - Comma-separated or array
   - `secondarySkills` (String, Optional)
   - `isFresher` (Boolean)
   - `companyName` (String, Optional)
   - `jobTitleExperience` (String, Optional)
   - `fromDate` (String/Date, Optional)
   - `toDate` (String/Date, Optional)
   - `isCurrentlyWorking` (Boolean, Optional)
   - `jobDescription` (String, Text, Optional) - Experience details
   - `coverLetter` (String, Text, Optional)
   - `preferredJobLocation` (String)
   - `currentCTC` (String, Optional)
   - `expectedSalary` (String)
   - `noticePeriod` (String)
   - `acceptedTerms` (Boolean, Must be true)
   - `notifiedForSimilarJobs` (Boolean)
   - `appliedAt` (Timestamp)

### 5. Job (If backend manages job postings)
   - `jobId` (String, Primary Key)
   - `title` (String)
   - `company` (String)
   - `location` (String)
   - `department` (String)
   - `description` (Text)
   - `employmentType` (String)
   - `salaryRange` (String, Optional)
   - `requiredSkills` (Array of Strings)
   - `postedDate` (Timestamp)
   - `isActive` (Boolean)

## III. API Endpoints

These are conceptual RESTful API endpoints. Actual paths and request/response structures can vary.

### 1. Authentication
   - **`POST /api/auth/signup`**
     - **Request Body**: `fullName`, `email`, `password`
     - **Action**:
       - Validate input.
       - Check if email already exists.
       - Generate OTP, store it (e.g., in OTP table or Redis) with an expiry.
       - Send OTP to user's email.
     - **Response**: Success message (e.g., "OTP sent to your email").
   - **`POST /api/auth/verify-otp`** (for signup)
     - **Request Body**: `email`, `otp`
     - **Action**:
       - Validate OTP against stored OTP for the email.
       - If valid: Mark email as verified (e.g., update `emailVerified` on User if user created, or store verification status temporarily). Create the user record in the database with `hashedPassword`.
     - **Response**: Success message, or JWT/session token for auto-login.
   - **`POST /api/auth/login`**
     - **Request Body**: `email`, `password`
     - **Action**:
       - Validate credentials against stored `hashedPassword`.
       - Ensure `emailVerified` is true.
       - Generate JWT or session token.
     - **Response**: User details (excluding password), JWT/session token.
   - **`POST /api/auth/logout`**
     - **Action**: Invalidate JWT/session token on the backend if necessary (e.g., for JWT, add to a blacklist until expiry).
     - **Response**: Success message.
   - **`POST /api/auth/forgot-password`**
     - **Request Body**: `email`
     - **Action**:
       - Check if user exists.
       - Generate a secure, time-limited password reset token.
       - Store the token (hashed) associated with the `userId`.
       - Send an email to the user with a link containing this token (e.g., `yourfrontend.com/auth/reset-password?token=TOKEN_VALUE`).
     - **Response**: Success message (e.g., "Password reset link sent to your email if account exists").
   - **`POST /api/auth/reset-password`**
     - **Request Body**: `token`, `newPassword`
     - **Action**:
       - Validate the token (check existence, expiry, not used).
       - Update user's `hashedPassword`.
       - Invalidate the reset token.
     - **Response**: Success message.

### 2. User Profile
   - **`GET /api/profile`** (Authenticated route)
     - **Action**: Fetch the profile for the currently authenticated user (`userId` from token/session).
     - **Response**: UserProfile data.
   - **`PUT /api/profile`** (Authenticated route)
     - **Request Body**: Fields from UserProfile to update (e.g., `phone`, `skills`, `resumeUrl`, etc.).
     - **Action**: Validate input. Update the user's profile in the database.
     - **Response**: Updated UserProfile data.

### 3. Job Application
   - **`POST /api/jobs/apply`** (Authenticated route)
     - **Request Body**: All fields from `ApplicationFormValues` (including `jobId`, `jobTitle`).
     *   **Resume Handling**: The frontend might send the resume as a `FormData` object (multipart/form-data). The backend needs to handle file uploads, validate size/type, and store it (e.g., AWS S3, Google Cloud Storage, or local file system if appropriate) and save the path in `JobApplication.resumeStoragePath`.
     - **Action**:
       - Validate input.
       - Store the application details in the `JobApplication` table.
       - **Trigger email notifications**:
         - Send application details to `erprabhat72@gmail.com`. This could use the logic from the existing Genkit flow (`format-application-email-flow.ts`) adapted for the backend, or a new backend email templating system.
         - Send a confirmation email to the applicant.
     - **Response**: Success message.
   - **`GET /api/applications/me`** (Authenticated route, Optional)
     - **Action**: Fetch a list of jobs the authenticated user has applied for.
     - **Response**: Array of `JobApplication` summaries or relevant job details.

### 4. Job Listings (If managed by backend)
   - **`GET /api/jobs`**
     - **Action**: Fetch a list of active jobs (with pagination, filtering options like location, department, keywords).
     - **Response**: Paginated list of Job data.
   - **`GET /api/jobs/{jobId}`**
     - **Action**: Fetch details for a specific job.
     - **Response**: Job data.
   - **`POST /api/jobs`** (Admin route)
     - **Action**: Create a new job posting.
     - **Trigger**: After successful creation, this could trigger the "Smart Job Matching Alert" logic.

## IV. Smart Job Matching Alert (Backend Logic)

This feature, if implemented on the backend, would require:
1.  **Trigger**: A mechanism to detect when a new job is posted (e.g., after `POST /api/jobs` or a database trigger).
2.  **User Skill Matching**:
    - Fetch all users who have opted into job notifications (`jobNotificationOptIn: true` in `UserProfile`).
    - For each user, retrieve their `skills`.
    - Retrieve the `requiredSkills` for the new job.
    - Perform the percentage match (as defined in the frontend's Genkit flow).
3.  **Email Notification**:
    - If the match percentage is >= 70%, format and send an email to the user. The email content logic from `src/ai/flows/generate-job-match-email-flow.ts` can be adapted or called by the backend.
    - This process should be asynchronous (e.g., using message queues or background jobs) to avoid blocking the job posting API response.

## V. Technologies & Considerations for Spring Boot

If using Java Spring Boot:

*   **Spring Security**: For authentication (JWT, OAuth2) and authorization.
*   **Spring Data JPA/Hibernate**: For database interaction (e.g., with PostgreSQL, MySQL).
*   **Spring Web MVC/WebFlux**: For creating REST APIs.
*   **Spring Mail**: For sending emails.
*   **File Handling**: For resume uploads (e.g., `MultipartFile`).
*   **Validation**: Bean Validation (JSR 380).
*   **Database**: Choose a relational (PostgreSQL, MySQL) or NoSQL (MongoDB - though careful schema design is still needed) database.
*   **Password Hashing**: Use a strong hashing algorithm like BCrypt.
*   **External Services**:
    *   Transactional Email Service (SendGrid, Amazon SES, Mailgun).
    *   Cloud Storage (AWS S3, Google Cloud Storage) if storing resumes.
*   **Project Structure**: Standard Maven/Gradle project structure with layers (Controller, Service, Repository).
*   **Error Handling**: Consistent error responses and logging.
*   **Testing**: Unit, integration, and API tests.

## VI. Interaction with Existing Genkit Flows (Optional)

If you want the backend to directly use the AI logic already defined in your Next.js project's Genkit flows:
1.  **Expose Genkit Flows as APIs**: Your Next.js app (when deployed) can expose Genkit flows as API routes. The Spring Boot backend could then make HTTP calls to these Next.js API routes. This might be simpler initially if you want to reuse the exact AI prompts and logic.
2.  **Replicate Logic in Backend**: Alternatively, the backend could implement its own logic to call the Google AI APIs directly, potentially using Google's Java client libraries, replicating the prompts and output structuring done by the Genkit flows.

This guide provides a starting point for defining the backend requirements based on the current frontend application. You would need to elaborate on each section, define detailed schemas, and design the specific architecture based on your chosen backend technology and scalability needs.
