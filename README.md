# NextJS Dashboard

A modern, high-performance dashboard application built with **Next.js**, **React**, and **TypeScript**, designed for extensible data visualization, API-driven workflows, and scalable enterprise use cases.

## 🚀 Features

-   **Next.js App Router (v14+)** with Server Actions
-   **TypeScript-first** development
-   **Responsive Dashboard Layout**
-   **Protected Routes & User Auth**
-   **API Handlers** for backend integration
-   **Reusable UI Components**
-   **Dark / Light Theme** toggle
-   **Optimized for Production**
-   Works with **Docker, Vercel, or custom Node server**

## 🏗️ Tech Stack

-   Next.js 14+
-   React 19
-   TypeScript
-   Tailwind CSS
-   Prisma (optional)
-   PostgreSQL / MySQL / MSSQL
-   Docker Ready
-   Better Auth

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
│   ├── dashboard/
│   ├── api/
│   ├── auth/
│   └── layout.tsx
├── components/
├── lib/
├── prisma/
├── public/
└── README.md
```

## 🤝 Contributing

1. Fork the repo
2. Create new feature branch
3. Commit changes
4. Create Pull Request

