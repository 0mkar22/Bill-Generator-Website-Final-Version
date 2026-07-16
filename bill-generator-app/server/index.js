const dotenv = require("dotenv");
// 1. Initialize dotenv BEFORE requiring any files that rely on environment variables
dotenv.config();

const express = require("express");
const cors = require("cors");
const session = require('express-session');
const Keycloak = require('keycloak-connect');

// 2. Require the database AFTER dotenv is loaded. 
// We assign it to 'supabase' rather than 'connectDB' for clarity, 
// and we no longer need to invoke it as a function.
const supabase = require("./config/db");

const app = express();

// 3. Consolidate CORS configuration into a single middleware call
app.use(cors({
    origin: 'https://bill-generator-gateway.vercel.app', 
    credentials: true 
}));

app.use(express.json());

// Session Setup
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: process.env.SESSION_SECRET || 'some-secret', // Recommended: move this to .env
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// Keycloak Config
const keycloak = new Keycloak({ store: memoryStore }, {
  "realm": "BillGeneratorRealm",
  "auth-server-url": process.env.KEYCLOAK_URL, 
  "ssl-required": "external",
  "resource": "bill-generator-backend",
  "public-client": true,
  "confidential-port": 0
});

app.use(keycloak.middleware());

// Protect Routes
app.use("/api/workOrders", keycloak.protect(), require("./routes/workOrders"));
app.use("/api/invoices", keycloak.protect(), require("./routes/invoices"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));