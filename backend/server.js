const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- SETUP EXPRESS APP ---
const app = express();            // <-- Define app FIRST

app.use(cors());
app.use(express.json());

// -- admin---
const doctorAdminRoutes = require('./routes/doctorAdminRoutes');
app.use('/api/admin/doctors', doctorAdminRoutes);

// --- ROUTES ---
const symptomRoutes = require('./routes/symptomRoutes');
app.use('/api/symptoms', symptomRoutes);  // <-- Use AFTER app is defined

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// --- CONNECT TO MONGODB ATLAS ---
mongoose.connect(
  'mongodb+srv://faiyazislam:c4yGTuxLqxzXeOTE@cluster0.ypess1w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
)
.then(() => console.log('MongoDB connected!'))
.catch(err => console.log('MongoDB connection error:', err));

// --- Start Server ---
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
