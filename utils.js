require('dotenv').config()
const { Resend } = require('resend')
const { users } = require('./models')
const resend =  new Resend(process.env.RESEND_API)
const jwt = require('jsonwebtoken')
const { StatusCodes } = require('http-status-codes')
const nodemailer = require('nodemailer')
const { Mongoose } = require('mongoose')
const mongoose = require('mongoose')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,       // your Clover Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // the 16-char app password
    },
})
async function SendEmail(receiver, otp) {
    // await resend.emails.send({
    //     from: "StudyLog <onboarding@resend.dev>",
    //     to: receiver,
    //     subject: "StudyLog's OTP for account setup",
    //     html: `<p>Your OTP is <strong>${otp}</strong>. Expires in 10 minutes.</p>`
    // })
    return transporter.sendMail({
        from: 'StudyLogs',
        to: receiver,
        subject: "StudyLog's OTP for account setup",
        html: `<p>Your OTP is <strong>${otp}</strong>. Expires in 10 minutes.</p>`
    })
}

const verifyUser = async (req, res, next) => {
    const error = new Error()
    const authHeader = req.headers['authorization'];
    console.log(authHeader)
    try { 
        const existingtoken = authHeader && authHeader.split(' ')[1];
        const payload = await jwt.verify(existingtoken, process.env.JWT_SECRET)
        const user = await users.findById(payload.id)
        req.pathList = req.path.split('/')
        req.user = user;
    }catch(err){
        error.status = StatusCodes.UNAUTHORIZED
        error.message = 'Invalid or Expired Token'
        throw error
    }
    if (req.pathList[req.pathList.length -1] !== 'otp' && !req.user.isVerified) {
        error.status = StatusCodes.FORBIDDEN
        error.message = 'The email has not been verified..........Send GET request to /otp'
        throw error
    }
    next()
}

module.exports = { SendEmail, verifyUser }
