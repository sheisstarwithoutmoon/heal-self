const mongoose = require('mongoose');
const { Schema } = mongoose;

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/mydb', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Doctor Schema
const doctorSchema = new Schema({
  doctor_id: {
    type: Number,
    unique: true,
    default: () => Math.floor(Math.random() * 1000000), // Simple auto-increment simulation
  },
  doctor_name: {
    type: String,
    required: true,
  },
  doctor_email: {
    type: String,
    required: true,
    unique: true,
  },
  specialisation: {
    type: String,
    required: true,
  },
  doctor_password: {
    type: String,
    required: true,
  },
});

// Patient Schema
const patientSchema = new Schema({
  patient_id: {
    type: Number,
    unique: true,
    default: () => Math.floor(Math.random() * 1000000), // Simple auto-increment simulation
  },
  patient_name: {
    type: String,
    required: true,
  },
  patient_age: {
    type: Number,
    required: true,
  },
  patient_email: {
    type: String,
    required: true,
    unique: true,
  },
  patient_password: {
    type: String,
    required: true,
  },
});

// Conversation Schema
const conversationSchema = new Schema({
  doctor_id: {
    type: Number,
    ref: 'Doctor',
    required: true,
  },
  patient_id: {
    type: Number,
    ref: 'Patient',
    required: true,
  },
});

// Text Schema
const textSchema = new Schema({
  convo_id: {
    type: Schema.Types.ObjectId, // Reference to Conversation _id
    ref: 'Conversation',
    required: true,
  },
  sender_type: {
    type: String,
    enum: ['doctor', 'patient'],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
});

// Define Models
const Doctor = mongoose.model('Doctor', doctorSchema);
const Patient = mongoose.model('Patient', patientSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Text = mongoose.model('Text', textSchema);

// Export Models
module.exports = { Doctor, Patient, Conversation, Text };