const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const supabase = require("./config/db");
const auth = require("./middleware/auth");

const app = express();

app.use(helmet());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    message: "Too many requests from this IP, please try again after 15 minutes",
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.use("/api/workOrders", auth, require("./routes/workOrders"));
app.use("/api/invoices", auth, require("./routes/invoices"));
app.use("/api/companies", auth, require("./routes/companies"));
app.use("/api/team", auth, require("./routes/team"));
app.use("/api/personnelPayouts", auth, require("./routes/personnelPayouts"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
