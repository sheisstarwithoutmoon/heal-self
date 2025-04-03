const express = require("express");
const mongoose = require("mongoose");
const app = express();
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const session = require("express-session");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.set("view engine", "ejs");

// Session middleware
app.use(session({
  secret: "vanyaawasthi", // Replace with a secret key for your app
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // Set to true if you're using HTTPS
}));

// MongoDB connection configuration
const mongoURI = "mongodb://127.0.0.1:27017/mydb"; // Default MongoDB port and database name

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if unable to connect to the database
  });

// Example route to test MongoDB connection
app.get("/testdb", async (req, res) => {
  try {
    // Simple test: Create and save a test document
    const Test = mongoose.model("Test", new mongoose.Schema({ value: Number }));
    const testDoc = new Test({ value: 2 });
    await testDoc.save();
    const result = await Test.findOne({ value: 2 });
    res.send(`The value is: ${result.value}`);
  } catch (err) {
    console.error("Error executing query:", err);
    res.status(500).send("Error executing query");
  }
});

// Example root route
app.get("/", (req, res) => {
  res.render("index");
});

// Routes
app.use(authRoutes);

app.listen(3000, () => {
  console.log("Server is running on port 3000 http://localhost:3000");
});
