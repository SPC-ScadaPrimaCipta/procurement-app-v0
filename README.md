# Procurement App (v0.1.0)

A comprehensive Procurement and Contract Management application built with **Next.js 16**, **React 19**, and **TypeScript**. Designed to streamline procurement cases, manage complex workflows, and handle contract lifecycles with RBAC security.

## 🚀 Features

-   **Next.js App Router (v16)** with Server Actions
-   **TypeScript-first** development
-   **Procurement Management**:
    -   End-to-end Procurement Case tracking.
    -   Integrated Workflow Engine for approvals.
    -   Dynamic forwarding and status updates.
-   **Contract Management**:
    -   Contract Creation and Lifecycle management.
    -   Payment Plan scheduling (Termin/Bulanan).
    -   Vendor Management.
-   **Advanced Workflow Engine**:
    -   Multi-step approval flows with configurable sendback logic.
    -   Dynamic approver selection (User/Role based).
    -   Visual progress tracking.
-   **Role-Based Access Control (RBAC)**:
    -   Dynamic permission checks using `better-auth`.
    -   Granular access based on Roles (e.g., PPK, Staff).
-   **Responsive & Themed UI**:
    -   Dark / Light Theme toggle.
    -   Rich interactive components.

## 🏗️ Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Core**: React 19
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS 4, Radix UI, Lucide React
-   **Database**: PostgreSQL, Prisma ORM
-   **Authentication**: Better Auth
-   **Visualization**: Recharts
-   **Utilities**: date-fns, zod, react-hook-form

## 📦 Installation

### 1. Clone the project

```bash
git clone https://github.com/jarfajar2314/nextjs-dashboard.git
cd nextjs-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` file:

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
BETTER_AUTH_SECRET="your_secret_here"
```

### 4. Database Setup

To get started, you need to migrate the schema to your database.

```bash
# Push the database schema
npx prisma migrate reset
```

### 5. Create a Superadmin User

After setting up the database, create a Superadmin user to access all features.

1.  **Register a User**: Run the app (`npm run dev`), go to the login page, and create a new account.
2.  **Assign Superadmin Role**: Run the provided script to promote your user to superadmin. You will need your User ID (which you can find in the database, or via `npx prisma studio`).

```bash
# Syntax
npx tsx prisma/assign-superadmin.ts <USER_ID>

# Example
npx tsx prisma/assign-superadmin.ts cm5j4920v0000abc123xyz
```

## ▶️ Running the App

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

### 🐳 Deployment with Docker

Reliably deploy the application using Docker Compose.

1.  **Configure Environment**:
    Open `docker-compose.yml` and populate the environment variables.

    ```yaml
    environment:
        DATABASE_URL: "postgresql://..."
        BETTER_AUTH_SECRET: "your_secret..."
        # ...
    ```

    > **Tip**: For multi-tenant Microsoft Authentication, set `MICROSOFT_TENANT_ID` to `"common"`. This allows users from any Azure AD tenant to sign in.

2.  **Build and Start**:

    ```bash
    docker-compose up -d --build
    ```

3.  **Access**:
    The dashboard will be running on `http://localhost:3002`.

## 📁 Project Structure

```
nextjs-dashboard/
├── app/
│   ├── (dashboard)/    # Dashboard layout and pages
│   ├── api/            # API Routes
│   ├── auth/           # Authentication pages
│   └── globals.css     # Global styles
├── components/         # Reusable UI components
├── lib/                # Utilities, hooks, and configurations
├── prisma/             # Database schema
├── public/             # Static assets
└── README.md
```

## 🤝 Contributing

1. Fork the repo
2. Create new feature branch
3. Commit changes
4. Create Pull Request
