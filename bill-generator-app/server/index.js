const dotenv = require("dotenv");
// 1. Initialize dotenv BEFORE requiring any files that rely on environment variables
dotenv.config();

const express = require("express");
const cors = require("cors");

// 2. Require the database client AFTER dotenv is loaded
const supabase = require("./config/db");

const app = express();

// 3. CORS configuration allowing your Vercel frontend to communicate with Render
app.use(cors({
    origin: 'https://bill-generator-gateway.vercel.app', 
    credentials: true 
}));

app.use(express.json());

// 4. Exposed Routes
// The controller files are now responsible for handling queries using the Supabase client
app.use("/api/workOrders", require("./routes/workOrders"));
app.use("/api/invoices", require("./routes/invoices"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));