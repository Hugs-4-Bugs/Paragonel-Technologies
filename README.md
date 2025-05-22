
# QuantumFusion Solutions Website

## About This Project

This is the official website for QuantumFusion Solutions, an innovative IT company focused on delivering cutting-edge solutions in AI (Artificial Intelligence), Cloud Computing, DevOps, and SaaS Platforms. The website aims to showcase the company's expertise, services, portfolio, and vision, providing a sleek, ultra-modern, and professional online presence.

## Core Features

*   **Sticky Navigation Bar**: Easy access to all main sections, with a responsive burger menu for mobile/tablet.
*   **Dynamic Hero Section**: Featuring the company tagline "Shaping the Future for Tomorrow" with an animated gradient background.
*   **Comprehensive Sections**:
    *   **About Us**: Mission, vision, company story, and values.
    *   **Services**: Detailed pages for AI Solutions, Cloud Infrastructure, DevOps Automation, and SaaS Platforms.
    *   **Portfolio**: Carousel showcasing successful projects.
    *   **Team**: Profile cards for team members, including the Founder & CEO.
    *   **Careers**: Interactive job board with filtering (Location, Department, Employment Type, Work Arrangement) and a "View Open Roles" toggle.
    *   **Blog**: Listing of articles with individual detail pages.
    *   **Testimonials**: Client success stories presented in a carousel.
    *   **FAQ**: Accordion-style question and answer section.
    *   **Contact**: Form for inquiries and detailed contact information.
*   **AI-Powered Chat Assistant**: A globally accessible chat widget (powered by Genkit) to answer user questions about QuantumFusion Solutions.
*   **AI Content Curation**:
    *   Personalized content recommendations based on simulated user behavior.
    *   Dynamic tech news section fetching plausible recent headlines.
*   **User Authentication UI**: Frontend forms for Login, Signup, Forgot Password, and Reset Password (backend integration required).
*   **Newsletter Subscription**: Integrated into the footer.
*   **Visual Design**:
    *   Sleek, ultra-modern aesthetic.
    *   Dark/Light theme toggle.
    *   Subtle animations on scroll and hover (ScrollFadeIn).
    *   Neon glow accents on icons.
    *   Responsive design for desktop, tablet, and mobile.

## Tech Stack

*   **Frontend**:
    *   Next.js 15 (App Router, Server Components, TypeScript)
    *   React 18
    *   ShadCN UI Components
    *   Tailwind CSS
    *   Lucide Icons (for iconography)
*   **Artificial Intelligence**:
    *   Genkit (Google AI SDK for JavaScript/TypeScript)
    *   Google AI (Gemini models for chat and content generation)
*   **Styling & Animations**:
    *   Tailwind CSS
    *   `tailwindcss-animate`
    *   Custom CSS for animated gradients and scroll effects.
*   **Form Handling**:
    *   `react-hook-form`
    *   `zod` (for schema validation)

## Getting Started (Local Development on macOS)

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

*   **Node.js**: It's recommended to use a Node Version Manager like `nvm` to install and manage Node.js versions. This project is built with a recent LTS version (e.g., Node.js 20.x or later).
    ```bash
    # Install nvm (if you haven't already)
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    # Install Node.js (e.g., latest LTS)
    nvm install --lts
    nvm use --lts
    ```
*   **Package Manager**: `npm` (comes with Node.js), `yarn`, or `pnpm`. This project uses `npm` by default as per `package.json` scripts.

### 1. Clone the Repository

If you haven't already, clone the project to your local machine:
```bash
git clone <your-repository-url>
cd <project-directory-name>
```

### 2. Install Dependencies

Install the project dependencies using npm:
```bash
npm install
```
If you prefer yarn or pnpm:
```bash
# yarn install
# pnpm install
```

### 3. Environment Variables

The Genkit AI features require a Google AI API key.

1.  Create a `.env` file in the root of your project (this file is usually gitignored).
    ```bash
    touch .env
    ```
2.  Add your Google AI API key to the `.env` file:
    ```
    GOOGLE_API_KEY="YOUR_GOOGLE_AI_API_KEY"
    ```
    *   **To get a Google AI API Key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.

### 4. Run the Development Servers

This project requires two separate development servers to run concurrently: one for the Next.js application and one for the Genkit AI flows.

*   **Terminal 1: Start the Next.js Application**
    ```bash
    npm run dev
    ```
    This will typically start the Next.js app on `http://localhost:9002` (as configured in `package.json`).

*   **Terminal 2: Start the Genkit Development Server**
    ```bash
    npm run genkit:dev
    ```
    Alternatively, for auto-reloading of Genkit flows on change:
    ```bash
    npm run genkit:watch
    ```
    This will typically start the Genkit Developer UI on `http://localhost:4000`, where you can inspect and test your AI flows.

### Accessing the App

*   **Website**: Open your browser and navigate to `http://localhost:9002`.
*   **Genkit Developer UI**: Open `http://localhost:4000` to monitor and test AI flows.

## Building for Production

To create a production build of the Next.js application:
```bash
npm run build
```
This command compiles and optimizes your application for deployment. The output will be in the `.next` directory.

## Deployment

You can deploy this Next.js application to various hosting platforms. Vercel and Netlify are popular choices.

### General Configuration for Deployment

*   **Environment Variables**: Ensure that the `GOOGLE_API_KEY` (and any other necessary environment variables) is set up in your deployment platform's environment variable settings.
*   **Build Command**: The standard build command is `npm run build` or `next build`.
*   **Output Directory**: For Next.js, this is typically `.next`.

### Vercel

Vercel is highly recommended for Next.js projects as it's developed by the creators of Next.js.
1.  Connect your Git repository to Vercel.
2.  Vercel usually auto-detects Next.js projects.
    *   **Framework Preset**: Should be "Next.js".
    *   **Build Command**: `npm run build` (or `next build`).
    *   **Output Directory**: Should be automatically configured.
3.  Configure your `GOOGLE_API_KEY` in the Vercel project settings (Environment Variables).
4.  Deploy. Vercel handles Next.js features like Server Components and API Routes (used by Genkit's Next.js plugin) automatically.

### Netlify

1.  Connect your Git repository to Netlify.
2.  Configure the build settings:
    *   **Build command**: `npm run build` (or `next build`).
    *   **Publish directory**: `.next`.
3.  Configure your `GOOGLE_API_KEY` in Netlify's site settings (Build & deploy > Environment > Environment variables).
4.  Netlify's Next.js runtime should handle the necessary configurations for deploying Next.js apps, including API routes that Genkit might use.

## Available Scripts

Key scripts available in `package.json`:

*   `npm run dev`: Starts the Next.js development server (app on `http://localhost:9002`).
*   `npm run genkit:dev`: Starts the Genkit development server (Genkit UI on `http://localhost:4000`).
*   `npm run genkit:watch`: Starts the Genkit development server with auto-reload on flow changes.
*   `npm run build`: Creates a production build of the Next.js app.
*   `npm run start`: Starts the Next.js production server (after running `npm run build`).
*   `npm run lint`: Runs ESLint to check for code quality issues.
*   `npm run typecheck`: Runs TypeScript compiler to check for type errors.

---

This README should provide a good starting point for managing and deploying your QuantumFusion Solutions website.
