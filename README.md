# Bill Generator Website

A robust, full-stack web application designed for managing work orders, generating professional invoices (Vendor and Work Order types), and creating detailed reports. This application is built with a microservices-oriented architecture using React, Node.js, and Docker, featuring authentication via Keycloak.

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
- **Authentication**: Secure login and role-based access control using Keycloak.
- **Dynamic Pricing**: Automated calculation of costs based on service type, duration, and location.

## ux Architecture

The application is designed to run as a multi-tier distributed system, likely deployed across three environments (or simulated locally):

1.  **Gateway Tier (`bill-generator-gateway`)**: Hosts the React Frontend and uses Caddy as a reverse proxy and web server.
2.  **App Tier (`bill-generator-app`)**: Hosts the Node.js/Express Backend and the Keycloak Identity Provider.
3.  **Data Tier (`bill-generator-data`)**: Hosts the MongoDB (Application Data) and PostgreSQL (Keycloak Data) databases.

## 🛠 Tech Stack

**Frontend:**
-   React.js (Vite)
-   Material UI (MUI)
-   Axios
-   HTML2Canvas & jsPDF

**Backend:**
-   Node.js
-   Express.js
-   Mongoose (ODM)
-   Keycloak (Authentication)

**Database:**
-   MongoDB (Work Orders & Invoices)
-   PostgreSQL (Identity Management)

**DevOps & Infrastructure:**
-   Docker & Docker Compose
-   Caddy (Web Server & Reverse Proxy)

## Ns Project Structure

```bash
├── bill-generator-app       # App Tier: Backend API & Auth
│   ├── server/              # Express.js Server
│   └── docker-compose.yml   # App Tier Orchestration (Server + Keycloak)
│
├── bill-generator-data      # Data Tier: Databases
│   └──QPdocker-compose.yml   # Data Tier Orchestration (Mongo + Postgres)
│
├── bill-generator-gateway   # Web Tier: Frontend & Proxy
│   ├── src/                 # React Source Code
│   ├── Caddyfile            # Web Server Configuration
│   ├── Dockerfile           # Frontend Build Config
│   └── docker-compose.yml   # Web Tier Orchestration (Client + Caddy)
