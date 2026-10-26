
# Paragonel: Backend API Requirements Guide (Phase 2.1)

This document specifies the technical requirements for a backend system (Java Spring Boot, Node.js, or Python) to support the full operational lifecycle of the Paragonel platform, including Recruiting (ATS), Lead Management, CMS, and Security Auditing.

---

## I. Core Data Models

### 1. User & Admin (Authentication)
*   **User**: Public job seeker account.
*   **Admin**: Internal staff with roles: `Founder` or `HR`.
*   **Fields**: `id`, `email`, `passwordHash`, `role`, `fullName`, `lastLoginAt`.

### 2. Job & Application (Recruiting/ATS)
*   **Job**: `id`, `jobId` (String), `title`, `department`, `location`, `description`, `skills` (Array), `isActive` (Boolean), `salaryRange`, `employmentType`, `workArrangement`, `postedDate`.
*   **JobApplication**: `id`, `applicationId`, `jobId`, `candidateName`, `candidateEmail`, `candidatePhone`, `resumeUrl` (S3/GCS Link), `skills` (Captured from resume), `status` (`New`, `Reviewing`, `Shortlisted`, `Interview Scheduled`, `Rejected`, `Hired`), `internalNotes` (Text), `appliedAt`.

### 3. Business Leads (CRM)
*   **Lead**: `id`, `name`, `email`, `company`, `message`, `source` (e.g., "Contact Page", "Service Inquiry"), `status` (`New`, `Contacted`, `Qualified`, `Closed`), `internalNotes`, `createdAt`.

### 4. Content (CMS)
*   **BlogPost**: `id`, `title`, `slug`, `author`, `body`, `excerpt`, `thumbnailUrl`, `category`, `tags`, `status` (`Published`, `Draft`, `Scheduled`), `publishAt` (Future date), `metaTitle`, `metaDescription`, `focusKeyword`, `canonicalUrl`.
*   **Service**: `id`, `title`, `slug`, `description`, `iconName`, `imageUrl`, `isActive`, `order`.
*   **PortfolioProject**: `id`, `name`, `category`, `description`, `imageUrl`, `techs` (Array), `link`, `status`, `createdAt`.
*   **Testimonial**: `id`, `name`, `role`, `company`, `content`, `rating` (1-5), `avatarUrl`.

### 5. Marketing & Governance
*   **NewsletterSubscriber**: `id`, `email`, `source`, `subscribedAt`.
*   **AuditLog**: `id`, `adminEmail`, `action`, `resourceType`, `resourceId`, `ipAddress`, `timestamp`.

---

## II. Required API Endpoints

### 1. Recruiting & ATS (Authenticated: HR/Founder)
*   `GET /api/admin/applications`: Fetch applications with filtering by status/job.
*   `GET /api/admin/applications/{id}`: Detailed candidate profile.
*   `PATCH /api/admin/applications/{id}/status`: Update hiring pipeline stage.
*   `PATCH /api/admin/applications/{id}/notes`: Update internal recruiter feedback.
*   `POST /api/jobs/apply`: (Public) Handle multipart form-data for resume upload (to S3/GCS) and Firestore entry.

### 2. Lead Management (Authenticated: Admin)
*   `GET /api/admin/leads`: Fetch all business inquiries.
*   `PATCH /api/admin/leads/{id}/status`: Update lead qualification stage.
*   `POST /api/leads`: (Public) Capture form submission.

### 3. Newsletter (Authenticated: Admin)
*   `GET /api/admin/newsletter`: Fetch subscribers.
*   `GET /api/admin/newsletter/export`: Generate CSV of all subscribers.
*   `POST /api/newsletter/subscribe`: (Public) Add new email.
*   `DELETE /api/admin/newsletter/{id}`: Remove subscriber.

### 4. CMS Operations (Authenticated: Admin)
*   `POST /api/admin/blog/autosave`: Temporary storage for draft recovery.
*   `PUT /api/admin/services/{id}`: Update service offerings.
*   `PUT /api/admin/portfolio/{id}`: Manage project showcases.
*   `PUT /api/admin/testimonials/{id}`: Manage client feedback.

### 5. Security & Auditing (System)
*   `GET /api/admin/activity`: Read-only stream of `AuditLog` entries.
*   **Internal Requirement**: Every `POST`, `PUT`, `PATCH`, or `DELETE` request in `/api/admin/*` must trigger an entry in `AuditLog`.

---

## III. Operational Logic

### 1. Soft Delete Pattern
Records for `Jobs`, `Blogs`, `Applications`, and `Leads` must never be physically deleted from the database via the API. 
*   Implement a `deleted_at` timestamp. 
*   The `GET` endpoints for the public site must filter for `deleted_at IS NULL`.
*   The Admin Panel must allow filtering by "Archived" records and provide a "Restore" action.

### 2. Blog Scheduling
*   The backend must run a cron job (every 10-15 minutes) to find `BlogPost` records where `status = 'Scheduled'` and `publishAt <= NOW()`, and update them to `status = 'Published'`.

### 3. File Storage
*   Resumes must be stored in a private S3 bucket or GCS bucket. 
*   The `resumeUrl` returned to the admin should ideally be a **Pre-signed URL** with a short expiration (e.g., 15 minutes) to ensure resumes are not publicly accessible.

### 4. Login Security (Rate Limiting)
*   Endpoint `POST /api/admin/auth/login` must implement a lockout mechanism.
*   Rule: Max 5 failures for a specific email or IP address within a 15-minute window.
*   After lockout, the account is blocked for 30 minutes.

### 5. Email Triggers
*   **New Application**: Send to `HR_EMAIL`. Include candidate name, job, and recruiter link.
*   **New Lead**: Send to `ADMIN_EMAIL`. Include full message and contact info.
*   **Newsletter Welcome**: Send to subscriber upon successful join.

---

## IV. Success Criteria
A successful backend implementation will allow the Paragonel frontend to:
1.  Manage a full hiring funnel without external tools.
2.  Maintain a secure audit trail for all content and operational changes.
3.  Scale the admin team by assigning granular roles (Founder/HR).
4.  Recover accidentally "deleted" business data instantly.
