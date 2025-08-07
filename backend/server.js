const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// --- SETUP EXPRESS APP ---
const app = express();           

app.use(cors());
app.use(express.json());

// -- ADMIN ROUTES ---
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

// -- DOCTOR ADMIN ROUTES ---
const doctorAdminRoutes = require('./routes/doctorAdminRoutes');
app.use('/api/admin/doctors', doctorAdminRoutes);

// --- ROUTES ---
const symptomRoutes = require('./routes/symptomRoutes');
app.use('/api/symptoms', symptomRoutes); 

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// --- DOCTOR ROUTES ---
const doctorRoutes = require('./routes/doctorRoutes');
app.use('/api/doctors', doctorRoutes);

// --- APPOINTMENT ROUTES ---
const appointmentRoutes = require('./routes/appointmentRoutes');
app.use('/api/appointments', appointmentRoutes);

// --- SCHEDULE ROUTES ---
const scheduleRoutes = require('./routes/scheduleRoutes');
app.use('/api/admin', scheduleRoutes);


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
