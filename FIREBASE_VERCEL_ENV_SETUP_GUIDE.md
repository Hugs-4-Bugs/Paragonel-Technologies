
# Guide: Setting Up Firebase Environment Variables on Vercel

This guide provides step-by-step instructions on how to configure your Firebase project's web configuration keys as environment variables in your Vercel project. These keys are essential for the Firebase SDK (used for Firestore in the Profile section) to connect to your Firebase backend when your QuantumFusion Solutions website is deployed on Vercel.

## Prerequisites

1.  **Vercel Account**: You must have an active Vercel account.
2.  **Vercel Project**: Your QuantumFusion Solutions website should already be connected to a project on Vercel.
3.  **Firebase Project**: You need an active Firebase project with Firestore enabled.
4.  **Firebase Web App Configuration**: You need your Firebase project's web app configuration details.
    *   Go to your Firebase project in the [Firebase Console](https://console.firebase.google.com/).
    *   Click on the **Project Overview** (gear icon) next to "Project Overview" in the sidebar, then select **Project settings**.
    *   Scroll down to the "Your apps" section. If you haven't added a web app, click the **Web icon (`</>`)** to add one and register it.
    *   Once your web app is registered (or if it already exists), you'll find the `firebaseConfig` object. It looks like this:
        ```javascript
        const firebaseConfig = {
          apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXX",
          authDomain: "your-project-id.firebaseapp.com",
          projectId: "your-project-id",
          storageBucket: "your-project-id.appspot.com",
          messagingSenderId: "123456789012",
          appId: "1:123456789012:web:XXXXXXXXXXXXXXXXXXXXXX"
        };
        ```
        You will need these values.

## Step-by-Step Instructions to Add Variables to Vercel

1.  **Log in to Vercel**:
    *   Go to [vercel.com](https://vercel.com/) and log in to your account.

2.  **Navigate to Your Project**:
    *   From your Vercel dashboard, select the project for your QuantumFusion Solutions website.

3.  **Go to Project Settings**:
    *   Once inside your project's dashboard, click on the **"Settings"** tab.

4.  **Access Environment Variables**:
    *   In the project settings sidebar (usually on the left), click on **"Environment Variables"**.

5.  **Add New Environment Variables**:
    *   You will need to add each of the following Firebase configuration keys as separate environment variables.
    *   **Important**: For Next.js, environment variables that need to be accessible on the client-side (in the browser) **must** be prefixed with `NEXT_PUBLIC_`.

    *   **Variable 1: API Key**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_API_KEY`
        *   **Value**: Paste the `apiKey` value from your Firebase `firebaseConfig`.
        *   **Environments**: Select Production, Preview, and Development.
        *   Click **"Add"** or **"Save"**.

    *   **Variable 2: Auth Domain**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
        *   **Value**: Paste the `authDomain` value.
        *   **Environments**: Select all.
        *   Click **"Add"** or **"Save"**.

    *   **Variable 3: Project ID**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
        *   **Value**: Paste the `projectId` value.
        *   **Environments**: Select all.
        *   Click **"Add"** or **"Save"**.

    *   **Variable 4: Storage Bucket**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
        *   **Value**: Paste the `storageBucket` value.
        *   **Environments**: Select all.
        *   Click **"Add"** or **"Save"**.

    *   **Variable 5: Messaging Sender ID**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
        *   **Value**: Paste the `messagingSenderId` value.
        *   **Environments**: Select all.
        *   Click **"Add"** or **"Save"**.

    *   **Variable 6: App ID**
        *   **Key Name**: `NEXT_PUBLIC_FIREBASE_APP_ID`
        *   **Value**: Paste the `appId` value.
        *   **Environments**: Select all.
        *   Click **"Add"** or **"Save"**.

6.  **Redeploy Your Project**:
    *   After successfully adding all the environment variables, it's crucial to **redeploy** your project for the new variables to take effect.
    *   Go to the **"Deployments"** tab in your Vercel project.
    *   Find your latest deployment (or the specific deployment you want to update).
    *   Click on the three dots (ellipsis) or context menu icon next to that deployment and select **"Redeploy"**. Confirm if prompted.
    *   Alternatively, pushing a new commit to your connected Git repository will also trigger a new deployment that will pick up the new environment variables.

## Verification

Once the redeployment is complete:
*   Visit your live Vercel URL for the QuantumFusion Solutions website.
*   Navigate to the Profile page after logging in. It should now be able to connect to Firestore and load/save your profile data.
*   Check your browser's developer console for any Firebase-related errors. The "client is offline" error should be resolved.

## Security Reminder
*   Your Firebase API key and other configuration details are sensitive.
*   Using Vercel's environment variable system is the secure way to manage them for deployed applications. Do not commit them directly into your codebase.

---

By following these steps, your deployed QuantumFusion Solutions website on Vercel will have the necessary Firebase configuration to allow the Firebase SDK to connect to your Firestore database.
