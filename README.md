# Dashboard Project (v0.1.0)

A modern, high-performance dashboard application built with **Next.js 16**, **React 19**, and **TypeScript**, designed for extensible data visualization, API-driven workflows, and scalable enterprise use cases.

## 🚀 Features

-   **Next.js App Router (v16)** with Server Actions
-   **TypeScript-first** development
-   **Advanced Workflow Engine**:
    -   Multi-step approval flows with configurable sendback logic.
    -   Drafting mechanism for workflow steps.
    -   Dynamic approver selection (User/Role based).
-   **Role-Based Access Control (RBAC)**:
    -   Dynamic permission checks using `better-auth`.
    -   Granular "manage" vs "read" access controls.
-   **User Management System**:
    -   Create and Edit User dialogs.
    -   Role assignment and validation.
-   **Enhanced Profile Management**:
    -   Secure password updates.
    -   Profile information editing with optimized loading states.
-   **Responsive & Themed UI**:
    -   Dark / Light Theme toggle.
    -   Minimalist and dynamic animations.
-   **Optimized for Production**:
    -   Docker support.
    -   Prisma ORM with PostgreSQL.

## 🏗️ Tech Stack

-   **Framework**: Next.js 16 (App Router)
-   **Core**: React 19
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS 4, Radix UI, Lucide React
-   **Database**: PostgreSQL, Prisma ORM
-   **Authentication**: Better Auth
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

### With Docker

```bash
docker build -t nextjs-dashboard .
docker run -p 3000:3000 nextjs-dashboard
```

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

