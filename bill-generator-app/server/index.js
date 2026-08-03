const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const supabase = require("./config/db");
const auth = require("./middleware/auth");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json());

app.use("/api/workOrders", auth, require("./routes/workOrders"));
app.use("/api/invoices", auth, require("./routes/invoices"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
