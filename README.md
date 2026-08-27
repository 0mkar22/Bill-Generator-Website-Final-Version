# Bill Generator Website

A robust, full-stack web application designed for managing work orders, generating professional invoices (Vendor and Work Order types), and creating detailed reports. This application is built using React, Node.js, and Docker, featuring database and authentication powered by Supabase.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
  - [Environment Configuration](#environment-configuration)
  - [Running with Docker](#running-with-docker)
- [Usage](#usage)

## ✨ Features

- **Work Order Management**: Create, update, and manage detailed work orders for various services (Photography, Videography, Live Telecast, etc.).
- **Invoice Generation**:
  - **Work Order Invoice**: Generate invoices based on specific work orders.
  - **Vendor Invoice**: Create vendor-specific invoices with automatic tax (GST) calculations.
  - **PDF Export**: Download invoices as PDF files with custom formatting and signatures.
- **Reporting**: Generate comprehensive reports of work orders with options to export to Excel and PDF.
- **Authentication**: Secure login powered by Supabase Auth.
- **Dynamic Pricing**: Automated calculation of costs based on service type, duration, and location.

## ux Architecture

The application relies on a modern stack connecting to a managed backend-as-a-service (BaaS):

1.  **Frontend (`bill-generator-gateway`)**: A React Single Page Application (SPA) using Vite. It communicates directly with Supabase for Auth and specific data queries, and calls the Express backend for other API routes.
2.  **Backend (`bill-generator-app`)**: A Node.js/Express API that acts as a secure intermediary layer, executing CRUD operations against the database using the Supabase client.
3.  **Database & Auth**: Supabase (managed PostgreSQL) handles all data storage (work orders, invoices, companies, team) and identity management.

## 🛠 Tech Stack

**Frontend:**
-   React.js (Vite)
-   Material UI (MUI)
-   Axios
-   HTML2Canvas & jsPDF

**Backend:**
-   Node.js
-   Express.js
-   Supabase Client (@supabase/supabase-js)

**Database:**
-   Supabase (PostgreSQL)

**DevOps & Infrastructure:**
-   Docker & Docker Compose
-   Caddy (Web Server & Reverse Proxy)

## Ns Project Structure

```bash
├── bill-generator-app       # Backend: Express API
│   ├── server/              # Express.js Server code
│   └── docker-compose.yml   # Backend Orchestration
│
├── bill-generator-data      # Legacy Data Tier (Mongo/Postgres docker config)
│
├── bill-generator-gateway   # Web Tier: Frontend & Proxy
│   ├── src/                 # React Source Code
│   ├── Caddyfile            # Web Server Configuration
│   ├── Dockerfile           # Frontend Build Config
│   └── docker-compose.yml   # Web Tier Orchestration (Client + Caddy)
```

## ⚙️ Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Docker & Docker Compose (Optional, for containerized deployment)
- A Supabase account/project

### 1. Environment Configuration
You will need to set up your environment variables.
- Navigate to both the `server` and `bill-generator-gateway` directories.
- Copy the `.env.example` files to `.env`.
- Fill in your API keys, database URIs, and Supabase credentials.

### 2. Local Development (Without Docker)
Start the Backend:
```bash
cd bill-generator-app/server
npm install
npm start
```
Start the Frontend:
```bash
cd bill-generator-gateway
npm install
npm run dev
```
The application should now be running on http://localhost:5173.

### 3. Deployment (With Docker)
To spin up the entire stack (Frontend, Backend, and Caddy server) using Docker Compose:
```bash
docker-compose up -d
```

## 🗄️ Database Setup
If setting up a fresh instance, execute the `migration.sql` file in your Supabase SQL editor to generate the required tables (`companies`, `team`, `invoices`, `workOrders`).

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
