const mongoose = require('mongoose');
const Specialty = require('./models/Specialty');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const Staff = require('./models/Staff');
const Schedule = require('./models/Schedule');

const specialties = [
    {
        "name": "Cardiology",
        "symptoms": [
            "chest pain", "palpitations", "shortness of breath", "swelling in legs",
            "fatigue", "fainting", "dizziness", "rapid heartbeat"
        ]
    },
    {
        "name": "Pulmonology",
        "symptoms": [
            "shortness of breath", "cough", "wheezing", "chest pain", "sputum", "fever", "night sweats"
        ]
    },
    {
        "name": "Neurology",
        "symptoms": [
            "headache", "dizziness", "numbness", "tingling", "weakness",
            "seizure", "blurred vision", "difficulty speaking", "memory loss", "fainting"
    ]
    },
    {
        "name": "Gastroenterology",
        "symptoms": [
            "abdominal pain", "nausea", "vomiting", "diarrhea", "constipation", "heartburn", "loss of appetite",
            "weight loss", "blood in stool", "jaundice"
        ]
    },
    {
        "name": "Dermatology",
        "symptoms": [
            "skin rash", "itching", "redness", "blisters", "dry skin", "hair loss", "nail changes", "acne"
        ]
    },
    {
        "name": "Endocrinology",
        "symptoms": [
            "weight gain", "weight loss", "increased thirst", "frequent urination", "fatigue", "hair loss",
            "heat intolerance", "cold intolerance"
        ]
    },
    {
        "name": "Rheumatology",
        "symptoms": [
            "joint pain", "joint swelling", "morning stiffness", "fatigue", "muscle pain", "rash", "fever"
        ]
    },
    {
        "name": "Ophthalmology",
        "symptoms": [
            "blurred vision", "eye pain", "red eyes", "itchy eyes", "watery eyes", "vision loss", "double vision"
        ]
    },
    {
        "name": "Otolaryngology",
        "symptoms": [
            "sore throat", "ear pain", "hearing loss", "nasal congestion", "runny nose", "hoarseness",
            "difficulty swallowing"
        ]
    },
    {
        "name": "Urology",
        "symptoms": [
            "painful urination", "blood in urine", "frequent urination", "incontinence", "flank pain"
        ]
    },
    {
        "name": "General Medicine",
        "symptoms": [
            "fever", "fatigue", "weight loss", "cough", "body ache", "sore throat", "nausea", "headache",
            "dizziness", "loss of appetite"
        ]
    }
];

const doctors = [
    {"name": "Dr. Sarah Johnson", "specialty": "Cardiology", "experience_years": 8, "department": "Cardiology Department"},
    {"name": "Dr. Michael Chen", "specialty": "Pulmonology", "experience_years": 12, "department": "Pulmonology Department"},
    {"name": "Dr. Emily Davis", "specialty": "Neurology", "experience_years": 15, "department": "Neurology Department"},
    {"name": "Dr. James Wilson", "specialty": "Gastroenterology", "experience_years": 10, "department": "Gastroenterology Department"},
    {"name": "Dr. Lisa Brown", "specialty": "Dermatology", "experience_years": 6, "department": "Dermatology Department"},
    {"name": "Dr. Robert Taylor", "specialty": "General Medicine", "experience_years": 20, "department": "General Medicine Department"}
];

const testUsers = [
    {
        "full_name": "John Smith",
        "email": "john.smith@email.com",
        "password": "password123",
        "phone": "1234567890",
        "dob": "1990-01-15",
        "gender": "Male",
        "address": "123 Main St, City, State 12345",
        "emergency_contact": {
            "name": "Jane Smith",
            "phone": "0987654321"
        }
    },
    {
        "full_name": "Sarah Johnson",
        "email": "sarah.johnson@email.com",
        "password": "password123",
        "phone": "2345678901",
        "dob": "1985-05-20",
        "gender": "Female",
        "address": "456 Oak Ave, City, State 12345",
        "emergency_contact": {
            "name": "Mike Johnson",
            "phone": "1098765432"
        }
    },
    {
        "full_name": "Michael Brown",
        "email": "michael.brown@email.com",
        "password": "password123",
        "phone": "3456789012",
        "dob": "1992-08-10",
        "gender": "Male",
        "address": "789 Pine Rd, City, State 12345",
        "emergency_contact": {
            "name": "Lisa Brown",
            "phone": "2109876543"
        }
    }
];

// Generate available slots for doctors
function generateAvailableSlots() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '14:00', end: '15:00' },
        { start: '15:00', end: '16:00' },
        { start: '16:00', end: '17:00' }
    ];
    
    const slots = [];
    days.forEach(day => {
        timeSlots.forEach(timeSlot => {
            slots.push({
                day: day,
                start: timeSlot.start,
                end: timeSlot.end,
                isBooked: false
            });
        });
    });
    
    return slots;
}

async function populate() {
    await mongoose.connect(
        'mongodb+srv://faiyazislam:c4yGTuxLqxzXeOTE@cluster0.ypess1w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );

    console.log("Starting database population...");

    // Clear old data (optional, for demo)
    await Specialty.deleteMany({});
    await Doctor.deleteMany({});
    await User.deleteMany({});
    await Appointment.deleteMany({});
    await Staff.deleteMany({});
    await Schedule.deleteMany({});

    // 1. Insert specialties
    const specialtyDocs = {};
    for (let spec of specialties) {
        const specialty = new Specialty(spec);
        await specialty.save();
        specialtyDocs[spec.name] = specialty;
    }
    console.log("Specialties inserted.");

    // 2. Insert test users
    const userDocs = {};
    for (let userData of testUsers) {
        const user = new User(userData);
        await user.save();
        userDocs[userData.email] = user;
    }
    console.log("Test users inserted.");

    // 3. Insert doctors with available slots
    const doctorDocs = {};
    for (let doc of doctors) {
        if (!specialtyDocs[doc.specialty]) {
            console.log(`Specialty not found for doctor: ${doc.name}`);
            continue;
        }
        const doctor = new Doctor({
            name: doc.name,
            specialty: specialtyDocs[doc.specialty]._id,
            experience_years: doc.experience_years,
            department: doc.department,
            available_slots: generateAvailableSlots()
        });
        await doctor.save();
        doctorDocs[doc.name] = doctor;
    }
    console.log("Doctors with available slots inserted.");

    // 4. Create some sample appointments
    const sampleAppointments = [
        {
            doctor: doctorDocs["Dr. Sarah Johnson"]._id,
            patient: userDocs["john.smith@email.com"]._id,
            day: "Monday",
            start: "09:00",
            end: "10:00",
            status: "booked"
        },
        {
            doctor: doctorDocs["Dr. Sarah Johnson"]._id,
            patient: userDocs["sarah.johnson@email.com"]._id,
            day: "Tuesday",
            start: "14:00",
            end: "15:00",
            status: "booked"
        },
        {
            doctor: doctorDocs["Dr. Michael Chen"]._id,
            patient: userDocs["michael.brown@email.com"]._id,
            day: "Wednesday",
            start: "11:00",
            end: "12:00",
            status: "booked"
        }
    ];

    for (let appointmentData of sampleAppointments) {
        const appointment = new Appointment(appointmentData);
        await appointment.save();
    }
    console.log("Sample appointments created.");

    // 5. Update doctor slots to mark some as booked
    for (let appointmentData of sampleAppointments) {
        await Doctor.updateOne(
            { 
                _id: appointmentData.doctor,
                'available_slots.day': appointmentData.day,
                'available_slots.start': appointmentData.start,
                'available_slots.end': appointmentData.end
            },
            { 
                $set: { 'available_slots.$.isBooked': true }
            }
        );
    }
    console.log("Doctor slots updated to reflect booked appointments.");

    // 6. Create staff members
    const staffMembers = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        phone: '123-456-7890',
        role: 'doctor',
        specialty: specialtyDocs['Cardiology']._id,
        experience_years: 8,
        department: 'Cardiology Department',
        qualification: 'MD, MBBS',
        license_number: 'DOC123456',
        hire_date: '2020-03-15',
        salary: 120000,
        status: 'active'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        phone: '123-456-7891',
        role: 'doctor',
        specialty: specialtyDocs['Pulmonology']._id,
        experience_years: 12,
        department: 'Pulmonology Department',
        qualification: 'MD, MBBS',
        license_number: 'DOC123457',
        hire_date: '2018-06-20',
        salary: 140000,
        status: 'active'
      },
      {
        name: 'Nurse Emily Davis',
        email: 'emily.davis@hospital.com',
        phone: '123-456-7892',
        role: 'nurse',
        department: 'Emergency Department',
        qualification: 'BSN, RN',
        license_number: 'NUR123456',
        hire_date: '2021-01-10',
        salary: 65000,
        status: 'active'
      },
      {
        name: 'Receptionist Lisa Brown',
        email: 'lisa.brown@hospital.com',
        phone: '123-456-7893',
        role: 'receptionist',
        department: 'Front Desk',
        qualification: 'High School Diploma',
        hire_date: '2022-03-01',
        salary: 35000,
        status: 'active'
      },
      {
        name: 'Admin John Smith',
        email: 'john.smith@hospital.com',
        phone: '123-456-7894',
        role: 'admin',
        department: 'Administration',
        qualification: 'MBA, Healthcare Management',
        hire_date: '2019-09-15',
        salary: 80000,
        status: 'active'
      }
    ];

    const staffDocs = {};
    for (let staffData of staffMembers) {
      const staff = new Staff(staffData);
      await staff.save();
      staffDocs[staffData.name] = staff;
    }
    console.log("Staff members inserted.");

    // 7. Create sample schedules
    const sampleSchedules = [
      {
        doctor: staffDocs["Dr. Sarah Johnson"]._id,
        day: "Monday",
        start_time: "08:00",
        end_time: "10:00",
        created_by: staffDocs["Admin John Smith"]._id
      },
      {
        doctor: staffDocs["Dr. Sarah Johnson"]._id,
        day: "Tuesday",
        start_time: "09:00",
        end_time: "11:00",
        created_by: staffDocs["Admin John Smith"]._id
      },
      {
        doctor: staffDocs["Dr. Michael Chen"]._id,
        day: "Monday",
        start_time: "10:00",
        end_time: "12:00",
        created_by: staffDocs["Admin John Smith"]._id
      },
      {
        doctor: staffDocs["Dr. Michael Chen"]._id,
        day: "Wednesday",
        start_time: "08:00",
        end_time: "11:00",
        created_by: staffDocs["Admin John Smith"]._id
      },
      {
        doctor: staffDocs["Nurse Emily Davis"]._id,
        day: "Thursday",
        start_time: "09:00",
        end_time: "12:00",
        created_by: staffDocs["Admin John Smith"]._id
      },
      {
        doctor: staffDocs["Receptionist Lisa Brown"]._id,
        day: "Friday",
        start_time: "08:00",
        end_time: "10:00",
        created_by: staffDocs["Admin John Smith"]._id
      }
    ];

    for (let scheduleData of sampleSchedules) {
      const schedule = new Schedule(scheduleData);
      await schedule.save();
    }
    console.log("Sample schedules created.");

    mongoose.disconnect();
    console.log("Database population completed successfully!");
    console.log("\nTest Data Created:");
    console.log("- 11 Specialties");
    console.log("- 3 Test Users");
    console.log("- 6 Doctors with available slots");
    console.log("- 3 Sample appointments");
    console.log("- 5 Staff members");
    console.log("- 6 Sample schedules");
    console.log("\nYou can now test the booking functionality!");
}

populate();
