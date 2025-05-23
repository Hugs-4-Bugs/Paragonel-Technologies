
# Guide: Setting Up GOOGLE_API_KEY on Vercel

This guide provides step-by-step instructions on how to configure your `GOOGLE_API_KEY` as an environment variable in your Vercel project. This key is essential for the Genkit AI features (like Personalized Insights, Tech News, and the Q&A Chatbot) to function correctly when your QuantumFusion Solutions website is deployed on Vercel.

## Prerequisites

1.  **Vercel Account**: You must have an active Vercel account.
2.  **Vercel Project**: Your QuantumFusion Solutions website should already be connected to a project on Vercel.
3.  **Google AI API Key**: You need to have your Google AI API key ready. You can obtain one from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Step-by-Step Instructions


1.  **Log in to Vercel**:
    *   Go to [vercel.com](https://vercel.com/) and log in to your account.

2.  **Navigate to Your Project**:
    *   From your Vercel dashboard, select the project for your QuantumFusion Solutions website.

3.  **Go to Project Settings**:
    *   Once inside your project's dashboard, click on the **"Settings"** tab.

4.  **Access Environment Variables**:
    *   In the project settings sidebar (usually on the left), click on **"Environment Variables"**.

5.  **Add a New Environment Variable**:
    *   You will see a section to add new environment variables.
    *   **Key Name**: Enter `GOOGLE_API_KEY`
        *   *Note: The name is case-sensitive and must match exactly.*
    *   **Value**: Paste your **actual Google AI API key** into this field.
        *   *Important: Keep this key confidential. Do not share it publicly or commit it to your Git repository.*
    *   **Environments**: Select the environments where this variable should be available. It's generally recommended to enable it for:
        *   **Production**
        *   **Preview**
        *   **Development** (this refers to Vercel's development environment, not your local machine's `.env` file)
    *   Click the **"Add"** or **"Save"** button (the exact wording might vary slightly on Vercel's UI).

6.  **Redeploy Your Project**:
    *   After successfully adding the environment variable, it's crucial to redeploy your project for the new variable to take effect.
    *   Go to the **"Deployments"** tab in your Vercel project.
    *   Find your latest deployment (or the specific deployment you want to update).
    *   Click on the three dots (ellipsis) or context menu icon next to that deployment and select **"Redeploy"**. Confirm if prompted.
    *   Alternatively, pushing a new commit to your connected Git repository will also trigger a new deployment that will pick up the new environment variable.

## Verification

Once the redeployment is complete:
*   Visit your live Vercel URL for the QuantumFusion Solutions website.
*   The "Personalized Insights For You" section and the "Latest Tech Insights" section should now load their content correctly.
*   The AI Chatbot should also be functional.

If these sections still show errors, double-check that the API key was copied correctly and that the variable name is exactly `GOOGLE_API_KEY`.

## Security Reminder
*   Your `GOOGLE_API_KEY` is sensitive. Treat it like a password.
*   Never commit it directly into your codebase or share it publicly. Using Vercel's environment variable system is the secure way to manage it for deployed applications.

---

By following these steps, your deployed QuantumFusion Solutions website on Vercel will have the necessary API key to power its AI features.
