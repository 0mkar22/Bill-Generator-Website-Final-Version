const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const session = require('express-session');
const Keycloak = require('keycloak-connect');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// 1. Session Setup
const memoryStore = new session.MemoryStore();
app.use(session({
  secret: 'some-secret',
  resave: false,
  saveUninitialized: true,
  store: memoryStore
}));

// 2. Keycloak Config
const keycloak = new Keycloak({ store: memoryStore }, {
  "realm": "BillGeneratorRealm",
  "auth-server-url": process.env.KEYCLOAK_URL, 
  "ssl-required": "external",
  "resource": "bill-generator-backend",
  "public-client": true,
  "confidential-port": 0
});

app.use(keycloak.middleware());

// 3. Protect Routes
app.use("/api/workOrders", keycloak.protect(), require("./routes/workOrders"));
app.use("/api/invoices", keycloak.protect(), require("./routes/invoices"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));