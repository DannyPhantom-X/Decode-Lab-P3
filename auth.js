const express = require('express')
const router = express.Router()
const { StatusCodes } = require('http-status-codes')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { users, otps } = require('./models')
const { SendEmail, verifyUser } = require('./utils')
const authVerify = async (req, res, next) => {
    const error = new Error()
    const authHeader = req.headers['authorization']
    try { 
        const existingtoken = authHeader && authHeader.split(' ')[1];
        const payload = await jwt.verify(existingtoken, process.env.JWT_SECRET)
        // const objectId = new mongoose.Types.ObjectId(payload.id);
        const user = await users.findById(payload.id)
        req.pathList = req.path.split('/')
        req.user = user;
    }catch{
        return next()
    }
    if (req.pathList[req.pathList.length -1] !== 'otp' && !req.user.isVerified) {
        error.status = StatusCodes.FORBIDDEN
        error.message = 'The email exists but has not been verified..........Send GET request to /otp'
        throw error
    }
    error.status = StatusCodes.FOUND
    error.message = 'User is already logged in'
    throw error
}
router.post('/register', authVerify, async (req, res) => {
    const error = new Error()
    const {username, email, password, confirmPassword} = req.body
    if(!username || !email || !password || !confirmPassword) {
        error.message = 'Please Provide Usename, email, password and Confirm Password'
        throw error
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const isMatch = await bcrypt.compare(confirmPassword, hashedPassword);
    if (!isMatch) {
        error.message = 'Password does not match'
        throw error
    }
    const userExists = await users.findOne({email})
    if (userExists) {
        if (userExists.isVerified) {
            error.message = 'User already exists!!!'
            throw error
        }
        await users.deleteOne({_id: userExists._id})
    }
    const user = await users.create({username, email, password: hashedPassword})
    const token = await jwt.sign(
        {id: user._id.toString()},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN || '30d'}
    )
    res.status(StatusCodes.OK).json({token: token, message: `Send GET request to /otp`});
})

router.post('/otp', verifyUser, async (req, res) => {
    const { otp } = req.body
    const error = new Error()
    if (req.user.isVerified) {
        error.message = 'No need for otp'
        throw error
    }
    if (!otp) {
        error.message = 'Please provide OTP'
        throw error
    }
    const userOtp = await otps.findOne({userId: req.user._id})
    if(!userOtp) {
        error.message = `OTP has expired......Request for another OTP from /otp`
        throw error
    }
    const isMatch = await bcrypt.compare(otp, userOtp.code)
    if(!isMatch) {
        error.message = 'Invalid OTP'
        throw error
    }
    await users.findByIdAndUpdate(req.user._id, {isVerified: true})
    res.status(StatusCodes.ACCEPTED).json('Done')
})

router.post('/login', authVerify, async (req, res) => {
    const error = new Error()
    const { email, password } = req.body
    if (!email || !password) {
        error.status = StatusCodes.BAD_REQUEST;
        error.message = 'Username and Password is required';
        throw error;
    }
    const user = await users.findOne({email : email})
    if (!user ) {
        error.status = StatusCodes.NOT_FOUND;
        error.message = 'Email does not exist';
        throw error;
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        error.status = StatusCodes.UNAUTHORIZED;
        error.message = 'Incorrect Password';
        throw error;
    }
    const token = await jwt.sign(
        {id: user._id.toString()},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN || '30d'})
    res.status(StatusCodes.OK).json(token)
})

router.get('/otp', verifyUser, async (req, res) => {
    if (req.user.isVerified) {
        res.json('Already Verified')
    }
    const newotp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOTP = await bcrypt.hash(newotp, 10)
    await SendEmail(req.user.email, newotp)
    await otps.create({userId: req.user._id, code: hashedOTP})
    res.status(StatusCodes.OK).json(`An OTP was sent to ${req.user.email}`)
})


module.exports = router