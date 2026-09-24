const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        minLength: [2, 'Username must be greater than 2 characters'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please fill a valid email address'],
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false,
        enum: [true, false]
    }
}, { timestamps: true })

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    purpose: {
        type: String,
        default: 'register',
        required: true,
        enum: ['register']
    },
    code: {
        type: String,
        required: true
    },
    createdAt: { type: Date, default: Date.now, expires: 300 }
})
const studyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Please Input userId"],
    },
    subject: {
        type: String,
        required: [true, "Please provide subject name"],
        minLength: [2, "Subject should be more than 2 characters"]
    },
    hoursStudied: {
        type: String,
        required: [true, "Input Hours studied"]
    },
    notes: {
        type: String
    },
    status: {
        type: String,
        default: 'pending',
        enum: ['pending', 'completed']
    }
}, {timestamps: true})


const users = mongoose.model('users', userSchema)
const otps = mongoose.model('otps', otpSchema)
const studyLogs = mongoose.model('studyLogs', studyLogSchema)
module.exports = {users,  otps, studyLogs}