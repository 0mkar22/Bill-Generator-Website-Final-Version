# Event Work Order & Bill Generator

A full-stack web application designed specifically for photography and videography agencies to manage event work orders, calculate dynamic pricing based on specific dimensions or personnel, and generate professional PDF and Word invoices.

## 🚀 Key Features

* **Dynamic Work Order Management:** Create entries for various events (Still Photography, Videography, Live Telecast, etc.) with customizable venues, dates, and personnel assignments.
* **Smart Area Calculations:** Dynamically calculates total square footage/inches for items like Lamination and Flex Banners by allowing users to add multiple length and breadth dimensions.
* **Assembly Grouping:** Tailored features for specific government formats (e.g., Maharashtra Vidhan Mandal) to group multiple members under specific assemblies (Vidhanparishad / Vidhansabha).
* **Automated Rate Calculation:** Fetches company-specific rates (e.g., ONGC) and automatically applies mathematical calculations, including automatic GST (CGST/SGST/IGST) and rounding.
* **Marathi Numeral Support:** Built-in interceptors that seamlessly convert Marathi numeric inputs (०-९) into standard English digits for backend calculations.
* **Invoice Exporting:** Generate customized Vendor Invoices and Work Order Invoices, with 1-click downloads for PDF (via `html2canvas` and `jsPDF`) and Microsoft Word (`.doc`).

## 🛠️ Tech Stack

**Frontend (Gateway):**
* React.js (Vite)
* Material-UI (MUI) for responsive component styling
* React Router for navigation
* Supabase Client (Database interaction)
* `html2canvas` & `jspdf` for document generation

**Backend (Server):**
* Node.js & Express.js
* RESTful API architecture (`/routes` and `/controllers` for Invoices and Work Orders)
* Middleware for authentication and validation

**Infrastructure:**
* PostgreSQL (Supabase)
* Docker & Docker Compose
* Caddy (Reverse Proxy / Web Server)

## 📁 Project Structure

```text
├── bill-generator-app/
│   └── server/                # Node.js Express Backend API
│       ├── config/            # Database configuration
│       ├── controllers/       # API business logic
│       ├── middleware/        # Auth & validation checks
│       └── routes/            # API endpoints (workOrders, invoices)
├── bill-generator-gateway/    # React (Vite) Frontend Application
│   ├── src/
│   │   ├── components/        # Reusable UI components (Layout, ErrorBoundary)
│   │   ├── constants/         # Static configuration (data.js)
│   │   ├── pages/             # App views (WorkOrder, InvoiceGenerator, etc.)
│   │   ├── services/          # API integration (api.js)
│   │   └── utils/             # Helper functions (math, string conversion)
│   └── public/                # Static assets (Logos, Signatures)
├── docker-compose.yml         # Container orchestration
└── migration.sql              # Database schema migrations
