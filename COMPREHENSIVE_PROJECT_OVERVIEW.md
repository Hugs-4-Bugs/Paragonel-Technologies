
# Paragonel: Comprehensive Project Overview

This document provides a detailed overview of the Paragonel website project, covering its architecture, features, technology stack, and data flow. It is intended to serve as a central knowledge base for understanding how the application is built and how its various components interact.

## 1. Project Introduction

Paragonel is an innovative IT company focused on delivering cutting-edge solutions in Artificial Intelligence (AI), Cloud Computing, DevOps, and SaaS Platforms. This website serves as its primary online presence, designed to:
- Showcase company expertise, services, and portfolio.
- Attract potential clients and partners.
- Provide a platform for job seekers to explore and apply for opportunities.
- Offer insights and information through a blog and AI-powered features.
- Ensure a professional, sleek, and ultra-modern user experience.

## 2. Technology Stack

- **Frontend**:
    - **Next.js 15**: React framework (App Router, Server & Client Components, TypeScript).
    - **React 18**: Library for building user interfaces.
    - **ShadCN UI**: Reusable UI components.
    - **Tailwind CSS**: Utility-first CSS framework for styling.
    - **Lucide Icons**: Icon library.
    - **`react-hook-form` & `zod`**: For form handling and validation.
- **Artificial Intelligence**:
    - **Genkit (Google AI SDK)**: For building AI-powered features.
    - **Google AI (Gemini Models)**: For chat, content generation, and email formatting.
- **Data Management (Client-Side & Simulated Backend)**:
    - **Firebase Firestore**: For storing user profiles.
    - **Static Data (`src/lib/data.ts`)**: For dummy jobs, blog posts, dropdown options.
    - **`localStorage`**: For persisting cookie preferences and simulated authentication state.
- **Styling & Animations**:
    - Tailwind CSS, `tailwindcss-animate`.
    - Custom CSS for gradients and scroll effects (`src/app/globals.css`).
- **State Management**:
    - React Context API (`AuthContext`, `CookieConsentContext`).
    - React Hooks (`useState`, `useEffect`, `useRef`).

## 3. Overall Architecture

### 3.1. Frontend (Next.js)
- **App Router**: The application uses the Next.js App Router for file-system based routing, layouts, and server/client component architecture.
- **Server Components**: Used for static content rendering, improving initial load performance.
- **Client Components (`"use client";`)**: Used for interactive UI elements, event handlers, and client-side state management (e.g., forms, modals, AI chat).
- **UI Structure**:
    - **Layout (`src/app/layout.tsx`)**: Root layout containing Navbar, Footer, Toaster, Cookie Consent system, and global providers (`AuthProvider`, `CookieConsentProvider`, `ThemeProvider`).
    - **Pages (`src/app/[page-name]/page.tsx`)**: Individual route components.
    - **Reusable Components (`src/components/`)**:
        - `layout/`: Navbar, Footer.
        - `sections/`: Components for content blocks on pages (Hero, About, Services, etc.).
        - `ui/`: ShadCN UI primitives.
        - `cookie-consent/`: Banner, Settings Modal, Manager.
        - Specific modals like `ApplyJobModal`, `JobDescriptionModal`.

### 3.2. AI Layer (Genkit)
- Genkit is initialized in `src/ai/genkit.ts`, configured to use Google AI models (e.g., Gemini 1.5 Flash).
- Individual AI capabilities are encapsulated in **Flows** located in `src/ai/flows/`. These flows are server-side functions that can be called from Client Components.
- Flows define input/output schemas using `zod` and use prompts (often with Handlebars templating) to interact with LLMs.
- The Genkit development server (run via `npm run genkit:dev`) is used locally to test and inspect flows.

### 3.3. Data Management
- **User Profiles**: Stored in Firebase Firestore under the `users/{uid}` path. The `src/lib/firebase.ts` file handles Firebase initialization.
- **Static Content**: `src/lib/data.ts` provides dummy data for job listings (`dummyJobs`), blog posts (`blogPosts`), and options for form dropdowns (locations, departments, etc.).
- **Client-Side Storage (`localStorage`)**:
    - `isAuthenticated` and basic `user` info (simulated auth session).
    - `cookie_consent` (whether consent has been given).
    - `cookie_preferences` (user's specific choices for cookie categories).
    - Theme preference (light/dark mode), linked to functional cookie consent.

### 3.4. Conceptual Backend Interaction
While the current application has a simulated backend for authentication and logs AI-formatted emails to the console, a full production system would require a dedicated backend. The `BACKEND_API_REQUIREMENTS_GUIDE.md` outlines the API endpoints and functionalities this backend would need to provide, such as:
- Real user registration with OTP verification via email.
- Secure user login and session management.
- Password reset functionality.
- Storing job applications.
- Sending actual emails (application confirmations, job match alerts).
- Managing job postings.

## 4. Key Frontend Features & Flows

### 4.1. Navigation System
- **Component**: `src/components/layout/navbar.tsx`
- **Features**:
    - Sticky at the top of the page.
    - **Desktop**: Displays main navigation links (Home, About, Services, Portfolio). A "More" dropdown menu (ShadCN `DropdownMenu`) houses additional links (Team, Careers, Blog, Testimonials, FAQ, Contact) to keep the navbar clean.
    - **Mobile/Tablet**: A responsive burger menu icon triggers a slide-out panel (ShadCN `Sheet`) listing all navigation links.
    - **Dynamic Auth Links**: Shows "Login" and "Sign Up" buttons if the user is not authenticated. If authenticated, it displays a circular avatar with the user's first initial and a dropdown with user's name, email, "My Profile," and "Logout" options.
    - **Theme Toggle**: `ThemeToggleButton` allows users to switch between light, dark, and system themes.

### 4.2. User Authentication (Simulated Flow)
- **Context**: `src/contexts/auth-context.tsx` manages the simulated authentication state (`isAuthenticated`, `user`, `isLoading`).
- **Persistence**: Simulates session persistence using `localStorage` for `isAuthenticated` and basic `user` info (`uid`, `email`, `fullName`).
- **Signup (`src/app/auth/signup/page.tsx`)**:
    - Form fields: Full Name, Email, Password (with complexity rules: min 8 chars, uppercase, digit, special char), Confirm Password.
    - **Simulated OTP Verification**:
        1. User enters email and clicks "Send OTP."
        2. UI updates to show OTP input field and "Verify OTP" button. A toast shows a simulated OTP (e.g., "123456").
        3. User enters OTP. Clicking "Verify OTP" compares it against the simulated OTP.
        4. On success, OTP section hides, "Sign Up" button enables.
    - On successful form submission (after OTP verification):
        1. `signup()` function in `AuthContext` is called. This adds the user (email, hashed password placeholder, fullName, generated UID) to an in-memory `simulatedUserDatabase` within the context.
        2. It then calls `login()` to auto-login the user.
        3. A console log simulates sending a confirmation email.
        4. User is redirected (e.g., to homepage or a previously intended page like careers).
- **Login (`src/app/auth/login/page.tsx`)**:
    - Form fields: Email, Password.
    - On submission, `login()` in `AuthContext` is called.
    - It checks credentials against the `simulatedUserDatabase`.
    - On success, sets `isAuthenticated` to true, stores user info in state and `localStorage`, and redirects.
    - Failure shows a toast message.
- **Logout**:
    - Triggered from the navbar user dropdown.
    - Calls `logout()` in `AuthContext`, which clears auth state from React state and `localStorage`.
    - Redirects to the homepage.
- **Forgot/Reset Password UI**:
    - `src/app/auth/forgot-password/page.tsx`: Form to enter email. Simulates sending a reset link (logs to console).
    - `src/app/auth/reset-password/page.tsx`: Form to enter new password. Simulates password update (logs to console).
- **Protected Job Application**:
    - In `src/components/sections/careers-section.tsx`, when "Apply Now" is clicked:
        1. It checks `isAuthenticated` from `AuthContext`.
        2. If not authenticated, it stores `actionAfterLogin: 'applyJobModalOpen'` and `pendingApplyJobId` in `localStorage` and redirects the user to `/auth/login`.
        3. If authenticated, it opens the `ApplyJobModal`.
    - After successful login, `AuthContext` checks `localStorage` for `actionAfterLogin` and redirects to `/careers`, where another `useEffect` in `CareersSection` picks up `pendingApplyJobId` and opens the apply modal for that job.

### 4.3. User Profile Section
- **Page**: `src/app/profile/page.tsx` (Client Component).
- **Access**: Protected; redirects to login if not authenticated.
- **Data Display**: Shows `fullName` and `email` (read-only from `AuthContext`).
- **Updatable Form**:
    - Fields: Phone Number, Skills (comma-separated `Textarea`), Resume URL (link to an online resume).
    - Validation: Uses `react-hook-form` and `zod`.
- **Firestore Integration**:
    - **Firebase Setup**: `src/lib/firebase.ts` initializes Firebase using environment variables (`NEXT_PUBLIC_FIREBASE_...`).
    - **Data Fetching**: On page load, fetches user profile data from Firestore collection `users` document `{uid}`. If data exists, form is pre-filled.
    - **Data Saving**: On "Save Profile" click, validated form data (phone, skills array, resumeUrl) along with `uid`, `fullName`, `email` and an `updatedAt` Firestore timestamp are saved/merged to the user's document in Firestore.
- **Applied Jobs Display**: Shows a list of job IDs (placeholder, not populated by the current application flow; would require backend integration to link applied jobs to the user profile).

### 4.4. Careers & Job Application System
- **Main Page**: `src/app/careers/page.tsx` renders `CareersSection`.
- **Component**: `src/components/sections/careers-section.tsx`.
- **Features**:
    - **"View Open Roles" Toggle**: Initially hides job listings. Clicking the button reveals them.
    - **Job Filters**:
        - Search by Keywords (title, company, description).
        - Filter by Job ID.
        - Location (Dropdown).
        - Department (Dropdown).
        - Employment Type (Dropdown).
        - Date Posted (Radio Group: Any time, Past month, Past week, Past 24 hours).
        - Work Arrangement (Radio Group: Any, Remote, Onsite).
    - **Job Listings**: Displays filtered jobs using `JobCard` components.
- **Job Card (`src/components/job-card.tsx`)**:
    - Displays job title, company, location, department, employment type, salary (if available), and a snippet of the description.
    *   Shows relative posted date (e.g., "Posted 2 days ago").
    *   **Interaction**:
        *   Clicking anywhere on the card (except the "Apply Now" button) opens the `JobDescriptionModal`.
        *   The "Apply Now" button opens the `ApplyJobModal`.
- **Job Description Modal (`src/components/job-description-modal.tsx`)**:
    - Displays full job details: title, company, location, department, type, salary, full description, posted date.
- **Job Application Modal (`src/components/apply-job-modal.tsx`)**:
    - A wide, scrollable modal with a multi-section form.
    - **Sections & Fields**:
        *   Personal Information: Full Name, Email (pre-filled if logged in & read-only), Phone, Resume Upload (PDF/DOC/DOCX, max 5MB), LinkedIn, Portfolio, Coding Profile URLs.
        *   Education Details: Highest Qualification (Dropdown), Specialization, University, Passing Year (Dropdown), Marks/CGPA.
        *   Skills: Primary and Secondary Skills (Textareas).
        *   Work Experience: "I am a Fresher" checkbox. If unchecked: Company Name, Job Title, From Date, To Date (with "Currently working here" checkbox), Job Description/Roles (Textarea).
        *   Additional Information: Cover Letter (Optional), Preferred Job Location (Dropdown), Current CTC (Optional), Expected Salary, Notice Period (Dropdown).
        *   Declarations: "I accept Terms..." (mandatory checkbox), "Notify me of similar jobs" (optional checkbox).
    - **Validation**: Uses `react-hook-form` and `zod` for comprehensive client-side validation.
    - **Submission**:
        1. Resume file converted to data URI (for potential use, though only filename is sent in simulated email).
        2. Calls `formatApplicationEmailFlow` (see Genkit Flows section).
        3. **Simulates Email Sending**: Logs the AI-formatted email content for admin (`erprabhat72@gmail.com`) and a confirmation email for the applicant to the console.
        4. Shows a success toast.

### 4.5. AI-Powered Chat Assistant
- **Component**: `src/components/sections/chat-section.tsx`.
- **Global Availability**: Added to `src/app/layout.tsx` to be present on all pages.
- **Auto-Open**: Opens automatically on initial page load. Can be manually closed/reopened.
- **UI**:
    - Floating action button when closed.
    - Expands to a chat window with a gradient header.
    - Input field for user questions, send button, microphone icon (visual placeholder for voice input - shows "coming soon" toast).
    - Scrollable area for conversation history (user messages right-aligned, AI messages left-aligned, with sender icons and timestamps).
- **Functionality**:
    - Calls `companyQnaFlow` with the user's question.
    - Displays AI's response.
    - **Clickable Links**: Parses Markdown links (`[text](url)`) in AI responses and renders them as `<a>` tags opening in a new tab.
    - Handles loading states and basic errors.

### 4.6. AI Content Curation (Homepage)
- **Personalized Recommendations (`src/components/sections/ai-content.tsx`)**:
    - Dynamically imported on `src/app/page.tsx`.
    - On mount, calls `recommendRelatedContent` Genkit flow with sample viewed job titles.
    - Displays AI-generated recommendations (e.g., related articles) in cards.
    - Handles loading and error states.
- **Dynamic Tech News (`src/components/sections/tech-news-section.tsx`)**:
    - Dynamically imported on `src/app/page.tsx`.
    - On mount, calls `fetchTechNews` Genkit flow for domains like AI, Cloud, DevOps, SaaS.
    - Displays AI-generated plausible news headlines and summaries in cards, including fictional sources and published dates.
    - Handles loading and error states.

### 4.7. Cookie Consent System
- **Core Logic**: `src/hooks/use-cookie-consent.tsx` (React Context based).
    - Manages consent state (`consentGiven`) and preferences (`essential`, `functional`, `performance`, `analytics`, `marketing`).
    - Stores preferences in `localStorage`.
    - Provides functions to accept all, reject non-essential, open settings, and save custom preferences.
- **Consent Banner (`src/components/cookie-consent/CookieConsentBanner.tsx`)**:
    - Appears on first visit (or if no consent stored).
    - Buttons: "Accept All," "Reject Non-Essential," "Customize Settings."
    - Responsive layout (buttons stack on mobile, horizontal on larger screens).
- **Settings Modal (`src/components/cookie-consent/CookieSettingsModal.tsx`)**:
    - Opened via "Customize" button or footer link.
    - Lists cookie categories with descriptions.
    - Toggles for Functional, Performance, Analytics, Marketing cookies. Essential cookies are always active (display only).
    - "Save Preferences" and "Cancel" buttons.
- **Manager (`src/components/cookie-consent/CookieConsentManager.tsx`)**:
    - Consumes the cookie consent context.
    - Simulates conditional loading of scripts by logging to the console based on `preferences` (e.g., "Analytics script would load now").
- **Theme Persistence (`src/components/theme-provider.tsx`)**:
    - Linked to "Functional Cookies" consent. If disabled, theme changes are not persisted to `localStorage`.
- **Integration**: `CookieConsentProvider` wraps the application in `src/app/layout.tsx`. Banner and Modal are also rendered here. A "Cookie Settings" link in the footer opens the modal.

### 4.8. Static Content Pages
These pages primarily display static information using components from `src/components/sections/`.
- **About (`/about`, `AboutSection`)**: Mission, vision, story, timeline infographic.
- **Services (`/services`, `ServicesSection`)**: Overview of services, linking to individual detail pages.
    - **Individual Service Pages (`/services/ai-solutions`, etc.)**: More detailed content about each service.
- **Portfolio (`/portfolio`, `PortfolioSection`)**: Carousel showcasing projects.
- **Team (`/team`, `TeamSection`)**: Profile cards for team members; clicking a card opens a modal with detailed bio and social links. Founder & CEO (Prabhat Kumar) details are included.
- **Blog (`/blog`, `BlogSection` for listing, `app/blog/[slug]/page.tsx` for detail)**:
    - Listing page displays blog post cards.
    - Detail pages (dynamic routes) show full post content (title, author, date, image, main content). Blog data from `src/lib/data.ts`.
- **Testimonials (`/testimonials`, `TestimonialsSection`)**: Client feedback in a carousel.
- **FAQ (`/faq`, `FaqSection`)**: Accordion-style Q&A.
- **Contact (`/contact`, `ContactSection`)**: Contact form (simulated submission) and company contact details.

## 5. Generative AI Features (Genkit Flows)

All flows are defined in `src/ai/flows/` and registered in `src/ai/dev.ts`. They use the global Genkit `ai` instance from `src/ai/genkit.ts`.

### 5.1. `companyQnaFlow` (`company-qna-flow.ts`)
- **Purpose**: Answers user questions about Paragonel.
- **Input**: `{ question: string }`
- **Output**: `{ answer: string }`
- **Logic**:
    - Prompt instructs the AI to act as a company assistant.
    - Provides company info (services, mission, founder, LinkedIn URL: `https://www.linkedin.com/company/106575838/admin/inbox/thread/2-OTQ5ODNjNjAtNDE0Yi00YTI3LWI5YTEtOGI5ZmQ0ZDNkMTAwXzEwMA==/`).
    - Instructed to use Markdown for links (`[text](url)`).
    - Guides AI to refer users to the Careers page or LinkedIn for job-related queries.
- **Invocation**: Called by `ChatSection` when a user sends a message.

### 5.2. `recommendRelatedContent` (`recommend-related-content.ts`)
- **Purpose**: Recommends blog posts or case studies based on (simulated) viewed job titles.
- **Input**: `{ jobTitles: string[] }`
- **Output**: `{ recommendations: string[] }`
- **Logic**:
    - Prompt asks AI to act as a content curator and suggest relevant content based on the input job titles.
- **Invocation**: Called by `AiContent` component on the homepage.

### 5.3. `fetchTechNews` (`fetch-tech-news.ts`)
- **Purpose**: Generates plausible recent tech news headlines and summaries.
- **Input**: `{ domains: string[], count?: number }` (e.g., domains: AI, Cloud, DevOps, SaaS).
- **Output**: `{ newsItems: Array<{ title: string, summary: string, source?: string, link?: string, publishedDate?: string }> }`
- **Logic**:
    - Prompt asks AI to act as a tech news curator.
    - Generates specified number of news items (title, summary, fictional source, placeholder link, estimated published date) for the given domains.
- **Invocation**: Called by `TechNewsSection` component on the homepage.

### 5.4. `formatApplicationEmailFlow` (`format-application-email-flow.ts`)
- **Purpose**: Formats detailed job application data into two emails: one for admin, one for applicant confirmation.
- **Input**: Comprehensive `FormatApplicationEmailInput` schema matching all fields from `ApplicationFormValues` (including resume filename, personal details, education, skills, experience, etc.).
- **Output**: `{ adminEmailSubject: string, adminEmailBody: string, applicantConfirmationSubject: string, applicantConfirmationBody: string }`
- **Logic**:
    - Prompt instructs AI to act as an HR assistant.
    - Uses Handlebars templating to structure applicant details.
    - Generates content for:
        1.  A detailed email to admin (`erprabhat72@gmail.com`) with all applicant data.
        2.  A confirmation email to the applicant.
    - Includes fallback content if AI fails to generate.
- **Invocation**: Called by `ApplyJobModal` upon successful form submission. Output is logged to console (simulating email sending).

### 5.5. `generateJobMatchEmailFlow` (`generate-job-match-email-flow.ts`)
- **Purpose**: Checks if a user's skills match a job's requirements and, if so, generates a notification email. Designed to be called by a backend system.
- **Input**: `{ jobId: string, userId: string }`
- **Output**: `{ shouldNotify: boolean, recipientEmail?: string, emailSubject?: string, emailBody?: string }`
- **Logic**:
    1.  Fetches job details (including `requiredSkills`) from `dummyJobs` using `jobId`.
    2.  Fetches user profile (`skills`, `email`, `fullName`) from Firestore (`users/{userId}`).
    3.  Calculates skill match percentage.
    4.  If match >= 70%:
        - Sets `shouldNotify: true`.
        - Uses an AI prompt to format a job notification email (job title, company, location, link to careers page).
        - Sets `recipientEmail`, `emailSubject`, `emailBody`.
- **Invocation**: Not directly called by the frontend. Intended for a backend system to trigger when a new job is posted.

## 6. Data Flow Examples

- **User Authentication (Signup)**:
    `SignupPage UI` -> User inputs Name, Email, Password -> (Simulated OTP) -> `AuthContext.signup()` -> Adds user to `simulatedUserDatabase` -> `AuthContext.login()` -> Sets `isAuthenticated=true`, `user` state -> Updates `localStorage` -> `Navbar` re-renders to show user avatar/dropdown -> User redirected.
- **AI Chat Interaction**:
    `ChatSection UI` -> User types question, clicks Send -> `companyQnaFlow({ question })` called -> Genkit interacts with Gemini model -> AI `answer` returned -> `ChatSection` updates `messages` state -> UI re-renders to show AI response.
- **Job Application Submission**:
    `ApplyJobModal UI` -> User fills form, clicks Submit -> Form data validated by Zod -> `formatApplicationEmailFlow(formData)` called -> Genkit interacts with Gemini model -> Formatted email subjects/bodies for admin and applicant returned -> Console logs simulate email sending -> Success toast shown, modal closes.
- **Profile Update**:
    `ProfilePage UI` -> User modifies phone/skills/resumeUrl, clicks Save -> Form data validated -> Data (including `uid`, `fullName`, `email` from `AuthContext`) prepared -> `setDoc(db, 'users', uid, profileData)` called -> Data saved to Firestore -> Success toast shown.
- **Homepage AI Content**:
    `AiContent component mounts` -> `recommendRelatedContent()` called -> Genkit -> AI -> Recommendations returned -> `AiContent` state updated -> UI displays recommendation cards.
    `TechNewsSection component mounts` -> `fetchTechNews()` called -> Genkit -> AI -> News items returned -> `TechNewsSection` state updated -> UI displays news cards.

## 7. Future Enhancements & Backend Integration Points

- **Real User Authentication**: Replace `AuthContext` simulation with a proper backend authentication system (e.g., Firebase Authentication, or a custom backend with JWTs). This would involve:
    - Securely storing user credentials.
    - Implementing real OTP email/SMS verification.
    - Server-side session management.
- **Job Application Storage**: Create backend APIs to receive job application data from the frontend modal and store it in a database (e.g., Firestore collection `jobApplications`).
- **Actual Email Sending**: Integrate services like SendGrid, Amazon SES, or Mailgun into the backend to send actual application confirmation emails and admin notifications.
- **Job Match Alert Automation**: Implement a backend process (e.g., Firebase Cloud Function) that:
    1. Triggers when a new job is posted (or on a schedule).
    2. Fetches all relevant users.
    3. For each user, calls the `generateJobMatchEmailFlow`.
    4. If `shouldNotify` is true, uses an email service to send the notification.
- **Admin Dashboard**: A separate interface for admins to manage job postings, view applications, etc.
- **Full Resume Upload**: Instead of just a URL, allow actual file uploads to cloud storage (e.g., Firebase Storage, AWS S3), storing the file path in the application/profile.
- **Advanced Search & Filtering**: More sophisticated job search capabilities.
- **Voice Input for Chat**: Integrate browser's SpeechRecognition API for real voice input.

This document provides a solid understanding of the Paragonel website as it currently stands.
