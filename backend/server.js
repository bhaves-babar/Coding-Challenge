const express = require("express");
const cors = require("cors"); // Import cors
const app = express();
const PORT = 5000;
const connectDB = require('./db');
connectDB();

// Enable CORS for requests from http://localhost:3000
app.use(cors({
    origin: 'http://localhost:3000', // Allow requests from this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify allowed methods if needed
    credentials: true // Allow cookies if needed for authentication
}));

app.use(express.json());

// Define a route for the home endpoint
app.get('/home', (req, res) => {
    res.send("Hello Assignment is running...");
});

// Import and use product routes
const productRoutes = require('./Routes/productRoutes');
app.use('/product', productRoutes);

const demo = require('./Routes/demo');
app.use('/demo', demo);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is online on port ${PORT}`);
});
