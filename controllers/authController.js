const { Doctor, Patient, Conversation, Text } = require('../models/User'); // Adjusted to Mongoose models
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configure Nodemailer with your app password
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: email, // Replace with your email
        pass: app_pass, // Replace with your app password
    },
    tls: {
        rejectUnauthorized: false,
    },
});

// Error handling for Doctor
const handleErrors_doctor = (err) => {
    let errorF = { doctor_name: "", doctor_email: "", specialisation: "" };
    if (err.code === 11000) { // MongoDB duplicate key error
        errorF.doctor_email = "That email is already registered";
    }
    if (err.name === 'ValidationError') {
        Object.keys(err.errors).forEach((key) => {
            errorF[key] = err.errors[key].message;
        });
    }
    return errorF;
};

// Error handling for Patient
const handleErrors_patient = (err) => {
    let errorF = { patient_name: "", patient_email: "", patient_age: "" };
    if (err.code === 11000) { // MongoDB duplicate key error
        errorF.patient_email = "That email is already registered";
    }
    if (err.name === 'ValidationError') {
        Object.keys(err.errors).forEach((key) => {
            errorF[key] = err.errors[key].message;
        });
    }
    return errorF;
};

// GET Routes
module.exports.doctorSignup_get = (req, res) => {
    res.render('doctorSignup');
};

module.exports.patientSignup_get = (req, res) => {
    res.render('patientSignup');
};

module.exports.docList_get = (req, res) => {
    res.render('docList');
};

// Doctor Signup POST
const crypto = require('crypto');
const Doctor = require('../models/Doctor'); // Adjust path as needed
const transporter = require('../config/email'); // Adjust path as needed
const { handleErrors_doctor } = require('../utils/errorHandler'); // Adjust path as needed

module.exports.doctorSignup_post = async (req, res) => {
    const { doctor_name, doctor_email, specialisation } = req.body;
    console.log("Processed request body:", { doctor_name, doctor_email, specialisation });

    try {
        const doctor_password = crypto.randomBytes(8).toString('hex');
        const doctor = new Doctor({ doctor_name, doctor_email, specialisation, doctor_password });
        await doctor.save();
        console.log("Doctor created:", doctor);

        const mailOptions = {
            from: email,
            to: doctor_email,
            subject: 'Your Account Password',
            text: `Your account has been created. Your password is: ${doctor_password}`,
        };

        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Error sending email:", error);
                    reject(error);
                } else {
                    console.log('Email sent: ' + info.response);
                    resolve(info);
                }
            });
        });

        res.redirect('/doctor/login');
    } catch (err) {
        console.error("Error in signup process:", err);
        const errors = handleErrors_doctor(err);
        res.render('doctorSignup', { 
            doctor_name, 
            doctor_email, 
            specialisation, 
            errors: errors.message || 'An error occurred during signup' 
        });
    }
};
// Patient Signup POST
module.exports.patientSignup_post = async (req, res) => {
    const { patient_name, patient_email, patient_age } = req.body;
    console.log("Processed request body:", { patient_name, patient_email, patient_age });
    const patient_password = crypto.randomBytes(8).toString('hex');

    try {
        const patient = new Patient({ patient_name, patient_email, patient_age, patient_password });
        await patient.save();
        console.log("Patient created:", patient);

        const mailOptions = {
            from: email,
            to: patient_email,
            subject: 'Your Account Password',
            text: `Your account has been created. Your password is: ${patient_password}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
        // res.render("doctorLogin");
        res.render('/doctor/login');
    } catch (err) {
        console.error("Error creating patient:", err);
        const errors = handleErrors_patient(err);
        res.status(400).json({ errors });
    }
};

// Login GET Routes
module.exports.doctorLogin_get = (req, res) => {
    res.render('doctorLogin');
};

module.exports.patientLogin_get = (req, res) => {
    res.render('patientLogin');
};

// Home GET Routes
module.exports.patientHome_get = (req, res) => {
    const patient_name = req.session.patient_name;
    if (patient_name) {
        res.render('patientHome', { patient_name });
    } else {
        res.redirect('/patient/login');
    }
};

module.exports.doctorHome_get = (req, res) => {
    const doctor_name = req.session.doctor_name;
    if (doctor_name) {
        res.render('doctorHome', { doctor_name });
    } else {
        res.redirect('/doctor/login');
    }
};

// Doctor Login POST
module.exports.doctorLogin_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log("Login attempt with email:", email);
        const doctor = await Doctor.findOne({ doctor_email: email, doctor_password: password });

        if (doctor) {
            console.log("Login successful for email:", email);
            req.session.doctor_id = doctor.doctor_id;
            req.session.doctor_name = doctor.doctor_name;
            res.status(200).json({ doctor });
        } else {
            console.log("Login failed for email:", email);
            res.status(400).json({ error: "Email or password incorrect" });
        }
    } catch (err) {
        console.error("Error during login attempt:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// Patient Chat GET
module.exports.patientChat_get = async (req, res) => {
    try {
        const messages = await Text.find().sort({ timestamp: 1 }); // Sort by timestamp ascending
        res.render('patientChat', { messages });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Patient Chat POST
module.exports.patientChat_post = async (req, res) => {
    const { text_message, user_type } = req.body;
    if (!text_message || !user_type) {
        return res.status(400).json({ error: 'Text and user type are required' });
    }
    try {
        const newMessage = new Text({ message: text_message, sender_type: user_type, timestamp: new Date() });
        await newMessage.save();
        res.json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).send('Internal Server Error');
    }
};

// Get Doctors by Specialisation
module.exports.getDoctorsBySpecialisation = async (req, res) => {
    const { specialisation } = req.query;
    try {
        console.log('Fetching doctors for specialization:', specialisation);
        const doctors = await Doctor.find({ specialisation });
        res.render('docList', { specialisation, doctors });
    } catch (err) {
        console.error('Error fetching doctors:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Store Messages
module.exports.storeMessages = async (req, res) => {
    const { doctor_id, patient_id } = req.query;
    try {
        const doctor = await Doctor.findOne({ doctor_id });
        const patient = await Patient.findOne({ patient_id });

        if (!doctor) return res.status(404).send('Doctor not found');
        if (!patient) return res.status(404).send('Patient not found');

        let conversation = await Conversation.findOne({ doctor_id, patient_id });
        if (!conversation) {
            conversation = new Conversation({ doctor_id, patient_id });
            await conversation.save();
        }

        res.render('chatPage', { doctor, patient, convo_id: conversation._id });
    } catch (err) {
        console.error('Error fetching doctor or patient:', err);
        res.status(500).send('Something went wrong');
    }
};

// Send Message
module.exports.sendMessage = async (req, res) => {
    const { convo_id, sender_type, message } = req.body;
    try {
        if (!convo_id || !sender_type || !message) {
            return res.status(400).send('convo_id, sender_type, and message are required');
        }

        const newMessage = new Text({ convo_id, sender_type, message, timestamp: new Date() });
        await newMessage.save();
        console.log(newMessage);
        res.status(200).json(newMessage);
    } catch (err) {
        console.error('Error sending message:', err);
        res.status(500).send('Something went wrong');
    }
};

// Load Messages
module.exports.loadMessages = async (req, res) => {
    const { convo_id } = req.query;
    try {
        const messages = await Text.find({ convo_id }).sort({ timestamp: 1 });
        res.status(200).json(messages);
    } catch (err) {
        console.error('Error loading messages:', err);
        res.status(500).send('Something went wrong');
    }
};

// Patient Login POST
module.exports.patientLogin_post = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log("Login attempt with email:", email);
        const patient = await Patient.findOne({ patient_email: email, patient_password: password });

        if (patient) {
            console.log("Login successful for email:", email);
            req.session.patient_id = patient.patient_id;
            req.session.patient_name = patient.patient_name;
            res.status(200).json({ patient });
        } else {
            console.log("Login failed for email:", email);
            res.status(400).json({ error: "Email or password incorrect" });
        }
    } catch (err) {
        console.error("Error during login attempt:", err);
        res.status(500).json({ error: "Something went wrong" });
    }
};

// Get Chat Page
module.exports.getChatPage = async (req, res) => {
    const { doctor_id } = req.query;
    try {
        const doctor = await Doctor.findOne({ doctor_id });
        if (!doctor) return res.status(404).send('Doctor not found');

        const patient_id = req.session.patient_id;
        let conversation = await Conversation.findOne({ doctor_id, patient_id });

        let convo_id;
        if (!conversation) {
            conversation = new Conversation({ doctor_id, patient_id });
            await conversation.save();
            convo_id = conversation._id;
        } else {
            convo_id = conversation._id;
        }

        res.render('chatPage', { doctor, convo_id, patient_id });
    } catch (err) {
        console.error('Error fetching doctor or creating conversation:', err);
        res.status(500).send('Something went wrong');
    }
};

// Get Conversation ID (Patient)
module.exports.getConversationId = async (req, res) => {
    const { doctor_id } = req.body;
    const patient_id = req.session.patient_id;

    try {
        const conversation = await Conversation.findOne({ doctor_id, patient_id });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.status(200).json({ convo_id: conversation._id });
    } catch (err) {
        console.error('Error fetching conversation ID:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Get Conversation ID (Doctor)
module.exports.getConversationId_doc = async (req, res) => {
    const { patient_id } = req.body;
    const doctor_id = req.session.doctor_id;

    try {
        const conversation = await Conversation.findOne({ doctor_id, patient_id });
        if (!conversation) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.status(200).json({ convo_id: conversation._id });
    } catch (err) {
        console.error('Error fetching conversation ID:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
};

// Get Doctor Inbox
module.exports.getDoctorInbox = async (req, res) => {
    const doctor_id = req.session.doctor_id;

    try {
        const conversations = await Conversation.find({ doctor_id }).populate('patient_id', 'patient_id patient_name');
        const formattedConversations = conversations.map(convo => ({
            patient_id: convo.patient_id.patient_id,
            patient_name: convo.patient_id.patient_name,
        }));

        res.render('doctorInbox', { formattedConversations });
    } catch (err) {
        console.error('Error fetching inbox messages:', err);
        res.status(500).send('Something went wrong');
    }
};

// Get Chat Page (Doctor)
module.exports.getChatPage_doctor = async (req, res) => {
    const doctor_id = req.session.doctor_id;
    const { patient_id } = req.query;

    try {
        const patient = await Patient.findOne({ patient_id });
        if (!patient) return res.status(404).send('Patient not found');

        let conversation = await Conversation.findOne({ doctor_id, patient_id });
        let convo_id;
        if (!conversation) {
            conversation = new Conversation({ doctor_id, patient_id });
            await conversation.save();
            convo_id = conversation._id;
        } else {
            convo_id = conversation._id;
        }

        res.render('chatPage_doctor', { doctor_id, convo_id, patient_id, doctor_name: req.session.doctor_name });
    } catch (err) {
        console.error('Error fetching patient or creating conversation:', err);
        res.status(500).send('Something went wrong');
    }
};