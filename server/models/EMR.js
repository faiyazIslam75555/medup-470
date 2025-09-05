import mongoose from 'mongoose';

const externalPrescriptionSchema = new mongoose.Schema(
  {
    disease: {
      type: String,
      required: true,
      trim: true,
    },
    prescribedMedicines: {
      type: String,
      required: true,
      trim: true,
    },
    documentUrl: {
      type: String, // Link or path to uploaded file (pdf/jpg, etc.)
      required: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  },
  { _id: false }
);

// NEW: Vitals schema for patient health monitoring
const vitalsSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    bloodPressure: {
      systolic: { type: Number, min: 50, max: 300 },
      diastolic: { type: Number, min: 30, max: 200 }
    },
    heartRate: { type: Number, min: 30, max: 200 },
    temperature: { type: Number, min: 30, max: 45 },
    weight: { type: Number, min: 0, max: 500 },
    notes: { type: String, trim: true, maxlength: 200 }
  },
  { _id: false }
);

const emrSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // One EMR per patient
    },
    appointments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment"
    }],
    prescriptions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription"
    }],
    invoices: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice"
    }],
    externalPrescriptions: [externalPrescriptionSchema], // Patient-uploaded past medical docs
    // NEW: Patient vitals tracking
    vitals: [vitalsSchema]
  },
  { timestamps: true }
);

const EMR = mongoose.model("EMR", emrSchema);

export default EMR;
