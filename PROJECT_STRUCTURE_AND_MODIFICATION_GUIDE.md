
# QuantumFusion Solutions Website: Structure & Modification Guide

This document provides an overview of the project structure and guidance on where to find and modify specific features of the QuantumFusion Solutions website.

## General Project Structure

*   **`src/app/`**: Contains all the routes, pages, and layouts for the Next.js App Router.
    *   **`src/app/layout.tsx`**: The main root layout for the entire application.
    *   **`src/app/globals.css`**: Global styles and Tailwind CSS theme variables (CSS HSL variables).
    *   **`src/app/[page-name]/page.tsx`**: Individual page components (e.g., `src/app/about/page.tsx`).
    *   **`src/app/auth/`**: Pages related to user authentication (login, signup, etc.).
    *   **`src/app/blog/[slug]/page.tsx`**: Dynamic route for individual blog posts.
    *   **`src/app/services/[service-name]/page.tsx`**: Dynamic or static routes for individual service detail pages.
    *   **`src/app/profile/page.tsx`**: User profile page for logged-in users.
*   **`src/components/`**: Reusable React components.
    *   **`src/components/layout/`**: Components for overall site structure (Navbar, Footer).
    *   **`src/components/sections/`**: Components for specific content sections on pages (Hero, About, Services, Team, Careers, Blog, Testimonials, FAQ, Contact, Chat, AI Content, Tech News, Newsletter).
    *   **`src/components/ui/`**: ShadCN UI components (Button, Card, Dialog, etc.).
    *   **`src/components/cookie-consent/`**: Components related to the cookie consent system.
    *   **`src/components/apply-job-modal.tsx`**: Modal for job applications.
    *   **`src/components/job-card.tsx`**: Component for displaying individual job listings.
    *   **`src/components/job-description-modal.tsx`**: Modal for displaying full job descriptions.
*   **`src/ai/`**: Genkit AI flows and configuration.
    *   **`src/ai/flows/`**: TypeScript files defining individual Genkit flows (e.g., `company-qna-flow.ts`, `format-application-email-flow.ts`, `generate-job-match-email-flow.ts`).
    *   **`src/ai/genkit.ts`**: Genkit initialization and global AI model configuration.
    *   **`src/ai/dev.ts`**: File used by the Genkit development server to register flows.
*   **`src/lib/`**: Utility functions, constants, and data.
    *   **`src/lib/utils.ts`**: General utility functions (e.g., `cn` for classnames).
    *   **`src/lib/data.ts`**: Static data for the site (e.g., dummy job listings, blog posts, dropdown options).
    *   **`src/lib/firebase.ts`**: Firebase initialization and Firestore instance.
*   **`src/contexts/`**: React Context API providers.
    *   **`src/contexts/auth-context.tsx`**: Manages simulated user authentication state.
*   **`src/hooks/`**: Custom React hooks.
    *   **`src/hooks/use-cookie-consent.tsx`**: Manages cookie consent state and logic.
    *   **`src/hooks/use-toast.ts`**: For displaying toast notifications.
*   **`src/types/`**: TypeScript type definitions.
    *   **`src/types/index.ts`**: Defines interfaces for `Job`, `BlogPost`, `ApplicationFormValues`, `UserProfile`, etc.
*   **`public/`**: Static assets like images and favicons.
    *   Place your company logo here (e.g., `qfs-logo.png`).
*   **`package.json`**: Project dependencies and scripts.
*   **`next.config.ts`**: Next.js configuration.
*   **`tailwind.config.ts`**: Tailwind CSS configuration.
*   **`README.md`**: General project information, setup, and deployment instructions.
*   **`PROJECT_STRUCTURE_AND_MODIFICATION_GUIDE.md`**: This file.
*   **`VERCEL_ENV_SETUP_GUIDE.md`**: Guide for setting up environment variables on Vercel.

---

## Feature-Specific Modification Guide

### 1. Branding & General Look/Feel

*   **Company Name**:
    *   Global Metadata: `src/app/layout.tsx` (in `metadata` object).
    *   Visual Text (if logo is text): `src/components/layout/navbar.tsx`, `src/components/layout/footer.tsx`.
    *   Throughout content in various section components (e.g., `src/components/sections/hero.tsx`, `src/components/sections/about-section.tsx`).
*   **Company Logo**:
    *   Place your logo image file (e.g., `qfs-logo.png`) in the `public/` directory.
    *   Update the `src` attribute of the `<Image>` component in:
        *   `src/components/layout/navbar.tsx`
        *   `src/components/layout/footer.tsx`
*   **Theme Colors (Dark/Light Mode)**:
    *   CSS HSL variables defined in `src/app/globals.css` under `:root` and `.dark`. Modify `--background`, `--foreground`, `--primary`, `--accent`, etc.
*   **Font**:
    *   Font setup (Geist Sans/Mono) is in `src/app/layout.tsx`.
    *   Font family applied globally via `src/app/globals.css`.

### 2. Navigation

*   **Navigation Links (Desktop & Mobile Menu)**:
    *   Add, remove, or reorder links in `src/components/layout/navbar.tsx` (in the `mainNavLinks` and `moreNavLinks` arrays).
    *   The mobile menu (`Sheet` component) dynamically generates links based on these arrays and auth state.

### 3. Hero Section

*   **Tagline & Description**: `src/components/sections/hero.tsx`.
*   **Animated Background**: The gradient animation is defined in `src/app/globals.css` (`.animated-gradient-background`).

### 4. About Us Section

*   **Content (Mission, Vision, Story)**: `src/components/sections/about-section.tsx`.
*   **Timeline Data**: Directly within `src/components/sections/about-section.tsx`.

### 5. Services Section

*   **Overall Service Cards Overview**:
    *   Content for each service card (title, description, icon, image placeholder link) is in `src/components/sections/services-section.tsx`.
    *   Update links to point to the correct detailed service pages.
*   **Individual Service Page Content**:
    *   `src/app/services/ai-solutions/page.tsx`
    *   `src/app/services/cloud-infrastructure/page.tsx`
    *   `src/app/services/devops-automation/page.tsx`
    *   `src/app/services/saas-platforms/page.tsx`
    *   Modify content, features, and image placeholders on these individual pages.

### 6. Portfolio Section

*   **Portfolio Items (Data & Carousel Display)**:
    *   Currently, portfolio items (title, category, image, description) are defined directly within `src/components/sections/portfolio-section.tsx`. Consider moving to `src/lib/data.ts` for easier management.

### 7. Team Section

*   **Team Member Details (Name, Title, Bio, Socials, Image Placeholder)**:
    *   Defined in the `teamMembers` array within `src/components/sections/team-section.tsx`.
    *   To add/update a team member's photo, place the image in `public/` and update the `imageUrl` path for that member.
*   **Modal for Detailed Bio**: The logic and display for the modal are also within `src/components/sections/team-section.tsx`.

### 8. Careers Section

*   **Job Listings Page Structure & Filters**:
    *   `src/components/sections/careers-section.tsx` handles the layout, filter UI, and logic for displaying jobs.
*   **Job Data (Dummy Jobs)**:
    *   `src/lib/data.ts` (the `dummyJobs` array). Update existing jobs or add new ones here. The `postedDate` field will be used to show how long ago a job was posted. Each job now also includes a `requiredSkills: string[]` array.
*   **Job Card Display**:
    *   The visual representation of each job is in `src/components/job-card.tsx`.
*   **Job Description Modal**:
    *   Opened when a job card is clicked. UI and logic in `src/components/job-description-modal.tsx`.
*   **Job Application Form Modal**:
    *   Triggered by the "Apply Now" button. UI, fields, and client-side validation (Zod schema) are in `src/components/apply-job-modal.tsx`.
    *   **Dropdown Options** (Highest Qualification, Passing Year, Preferred Location, Notice Period): These lists are populated from data in `src/lib/data.ts`.
    *   **Form Submission Logic**: Resides in `src/components/apply-job-modal.tsx`, including the call to the Genkit flow for email formatting.

### 9. Blog Section

*   **Blog Post Listing Page**:
    *   `src/app/blog/page.tsx` is the main page component. It uses components that might source data.
*   **Blog Post Data**:
    *   Defined in the `blogPosts` array in `src/lib/data.ts`. Add new posts or edit existing ones here. Remember to create a unique `slug` for each.
*   **Individual Blog Post Page (Dynamic Route)**:
    *   `src/app/blog/[slug]/page.tsx` dynamically renders individual posts based on the slug.
    *   It fetches data from `src/lib/data.ts`.
*   **Blog Snippet on Homepage**:
    *   Handled by `src/components/sections/blog-section.tsx` or directly in `src/app/page.tsx`.

### 10. Testimonials Section

*   **Testimonial Content & Slider Display**:
    *   Testimonial data (name, title, feedback, avatar placeholder) is currently defined directly within `src/components/sections/testimonials-section.tsx`. Consider moving to `src/lib/data.ts`.

### 11. FAQ Section

*   **Questions & Answers**:
    *   Defined in the `faqItems` array within `src/components/sections/faq-section.tsx`.

### 12. Contact Section

*   **Contact Form Fields & Information Display**:
    *   `src/components/sections/contact-section.tsx`.
    *   Form submission is currently simulated (logs to console).

### 13. Footer

*   **Links, Copyright, Social Icons**: `src/components/layout/footer.tsx`.
*   **Newsletter Subscription Form**:
    *   UI and client-side logic in `src/components/sections/newsletter-subscription.tsx`. Submission is simulated.

### 14. User Authentication (Simulated Frontend Flow)

*   **Core Authentication Logic & State (Context)**:
    *   `src/contexts/auth-context.tsx` manages `isAuthenticated`, `user` (now includes `uid` and `fullName`) state, simulated `login`, `logout`, `signup` functions, and `localStorage` persistence.
*   **Login Page**:
    *   UI and form handling: `src/app/auth/login/page.tsx`.
*   **Signup Page**:
    *   UI, form handling, and simulated OTP flow: `src/app/auth/signup/page.tsx`. Password complexity rules are defined in its Zod schema. `fullName` is now part of signup.
*   **Forgot Password Page**:
    *   UI and form handling: `src/app/auth/forgot-password/page.tsx`.
*   **Reset Password Page**:
    *   UI and form handling: `src/app/auth/reset-password/page.tsx`.
*   **Protected Job Application Flow**:
    *   Logic to check authentication and redirect to login if needed is in `src/components/sections/careers-section.tsx`.

### 15. User Profile Section

*   **Profile Page**: `src/app/profile/page.tsx`.
*   **Data Storage**: Profile data (phone, skills, resume URL) is fetched from and saved to Firestore under `users/{uid}`.
*   **Functionality**: Users can view their basic info (name, email from auth context) and update their phone, skills, and resume URL. Displays a placeholder for applied jobs.
*   **Firebase Configuration**: `src/lib/firebase.ts` initializes Firebase. Environment variables for Firebase config must be set in `.env` locally and in hosting provider settings.

### 16. Cookie Consent System

*   **Core Logic, State Management, & localStorage**:
    *   `src/hooks/use-cookie-consent.tsx` (uses React Context).
*   **Consent Banner UI**:
    *   `src/components/cookie-consent/CookieConsentBanner.tsx`.
*   **Settings Modal UI (Toggles & Descriptions)**:
    *   `src/components/cookie-consent/CookieSettingsModal.tsx`. Includes Essential, Functional, Performance, Analytics, and Marketing cookie categories.
*   **Simulation of Conditional Script Loading**:
    *   `src/components/cookie-consent/CookieConsentManager.tsx` (logs to console based on consent).
*   **Integration into Main Layout**:
    *   The `CookieConsentProvider`, `CookieConsentManager`, banner, and modal are added in `src/app/layout.tsx`.
*   **Theme Persistence Linkage**:
    *   `src/components/theme-provider.tsx` checks functional cookie consent for theme persistence.

### 17. AI-Powered Features (Genkit)

*   **Genkit Initialization & Model Choice**:
    *   `src/ai/genkit.ts`.
*   **Flow Registration for Development Server**:
    *   `src/ai/dev.ts` (imports all flow files).
*   **Company Q&A Chatbot**:
    *   **Flow Logic & Prompt**: `src/ai/flows/company-qna-flow.ts`. Modify the prompt here to change how the AI answers questions about the company. Includes LinkedIn URL.
    *   **Chat UI & Client-side Invocation**: `src/components/sections/chat-section.tsx`. Globally available, auto-opens, and displays user/AI messages with clickable links.
*   **AI Content Recommendations (Homepage)**:
    *   **Flow Logic & Prompt**: `src/ai/flows/recommend-related-content.ts`.
    *   **UI & Client-side Invocation**: `src/components/sections/ai-content.tsx`.
*   **Dynamic Tech News (Homepage)**:
    *   **Flow Logic & Prompt**: `src/ai/flows/fetch-tech-news.ts`.
    *   **UI & Client-side Invocation**: `src/components/sections/tech-news-section.tsx`.
*   **Application Email Formatting (for Job Applications)**:
    *   **Flow Logic & Prompt**: `src/ai/flows/format-application-email-flow.ts`. This flow formats details for both admin and applicant emails, including all fields from the detailed application form.
    *   **Invocation**: Called from `src/components/apply-job-modal.tsx` upon form submission.
*   **Job Match Notification Email Logic**:
    *   **Flow Logic & Prompt**: `src/ai/flows/generate-job-match-email-flow.ts`. This flow takes a `jobId` and `userId`, performs skill matching (user skills from Firestore, job skills from `dummyJobs`), and if a >=70% match occurs, formats a notification email.
    *   **Backend Trigger Required**: This flow demonstrates the *logic* for matching and email formatting. A separate backend process (e.g., Firebase Cloud Function) would be needed to automatically trigger this flow for all users when a new job is posted.
*   **Environment Variables**:
    *   Your `GOOGLE_API_KEY` for Genkit needs to be in a `.env` file at the project root for local development, and set in your hosting provider's environment settings for deployment.
    *   Firebase configuration variables (`NEXT_PUBLIC_FIREBASE_...`) also need to be set for the Profile section.

### 18. Images & Static Assets

*   **Company Logo, Favicon, Other Key Images**:
    *   Store these in the `public/` directory.
    *   Reference them with a leading slash in `src` attributes (e.g., `/logo.png`).
*   **Placeholder Images (`placehold.co`)**:
    *   Update the `src` attribute in various components.
    *   Update the `data-ai-hint` attribute on these images to provide better context if using AI image generation tools later.

### 19. Data (Jobs, Blog Posts, Dropdown Options)

*   **Central Data File**: `src/lib/data.ts` is the primary source for:
    *   `dummyJobs`: Job listings, now including `requiredSkills`.
    *   `blogPosts`: Blog content.
    *   `locations`, `departments`, `educationQualifications`, `noticePeriods`: Options for filters and forms.
    *   `generateYearOptions()`: For passing year dropdowns.

---

This guide should help you navigate the codebase and make targeted modifications. Remember to test thoroughly after making changes!
