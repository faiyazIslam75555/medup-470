const mongoose = require('mongoose');
const Specialty = require('./models/Specialty');
const Doctor = require('./models/Doctor');

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
    {"name": "Dr. Sharma", "specialty": "Cardiology"},
    {"name": "Dr. Mehta", "specialty": "Pulmonology"},
    {"name": "Dr. Sinha", "specialty": "Neurology"},
    {"name": "Dr. Ariful", "specialty": "Neurology"},
    {"name": "Dr. Rao", "specialty": "Gastroenterology"},
    {"name": "Dr. Kapoor", "specialty": "Dermatology"},
    {"name": "Dr. Verma", "specialty": "Endocrinology"},
    {"name": "Dr. Joshi", "specialty": "Rheumatology"},
    {"name": "Dr. Chatterjee", "specialty": "Ophthalmology"},
    {"name": "Dr. Banerjee", "specialty": "Otolaryngology"},
    {"name": "Dr. Gupta", "specialty": "Urology"},
    {"name": "Dr. Meena", "specialty": "General Medicine"}
];

async function populate() {
    await mongoose.connect(
        'mongodb+srv://faiyazislam:c4yGTuxLqxzXeOTE@cluster0.ypess1w.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );

    // Clear old data (optional, for demo)
    await Specialty.deleteMany({});
    await Doctor.deleteMany({});

    // 1. Insert specialties
    const specialtyDocs = {};
    for (let spec of specialties) {
        const specialty = new Specialty(spec);
        await specialty.save();
        specialtyDocs[spec.name] = specialty;
    }
    console.log("Specialties inserted.");

    // 2. Insert doctors, linking to specialties
    for (let doc of doctors) {
        if (!specialtyDocs[doc.specialty]) {
            console.log(`Specialty not found for doctor: ${doc.name}`);
            continue;
        }
        const doctor = new Doctor({
            name: doc.name,
            specialty: specialtyDocs[doc.specialty]._id
        });
        await doctor.save();
    }
    console.log("Doctors inserted.");

    mongoose.disconnect();
    console.log("Done.");
}

populate();
