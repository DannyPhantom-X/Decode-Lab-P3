const express = require('express');
const app = express();
const port = 6000 || process.env.PORT;
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes')
const { verifyUser } = require('./utils')
require('dotenv').config();
app.use(express.json())
app.use('/api/auth', require('./auth'))
const { studyLogs } = require('./models')

app.get('/api/studyLogs', verifyUser, async (req, res) => {
    const Log = await studyLogs.find({userId: req.user._id})
    if(Log) {
        res.status(StatusCodes.OK).json(Log)
    }else{
        res.status(StatusCodes.NOT_FOUND).json("You don't have any study logs create one now")
    }
})
app.get('/api/studyLogs/recent', verifyUser, async (req, res) => {
    const Log = await studyLogs.find({userId: req.user._id}).sort({createdAt: -1}).limit(3)
    if(Log) {
        res.status(StatusCodes.OK).json(Log)
    }else{
        res.status(StatusCodes.NOT_FOUND).json("You don't have any study logs create one now")
    }
})
app.get('/api/studyLogs/:logId', verifyUser, async (req, res) => {
    const logId = req.params.logId
    const objectId = new mongoose.Types.ObjectId(logId);
    const Log = await studyLogs.findOne({_id: objectId, userId: req.user._id})
    if(Log) {
        res.status(StatusCodes.OK).json(Log)
    }else{
        res.status(StatusCodes.NOT_FOUND).json("You don't have any study logs create one now")
    }
})
app.post('/api/studyLogs/create', verifyUser, async (req, res) => {
    const error = new Error()
    const { subject, hoursStudied, notes, status } = req.body
    if (!subject || !hoursStudied) {
        error.status = StatusCodes.NO_CONTENT
        error.message = 'Subject and Hours Studied is need!'
        throw error
    }
    const newLog = await studyLogs.create({userId: req.user._id, subject, hoursStudied, notes, status})
    res.status(StatusCodes.OK).json({log: newLog, message: 'Created'})
})
app.patch('/api/studyLogs/:logId', verifyUser, async (req, res) => {
    const { logId } = req.params
    console.log(req.body)
    const updataedLogs = await studyLogs.findOneAndUpdate({_id: logId, userId: req.user._id}, req.body, {new: true, runValidators: true})
    res.json(updataedLogs)
})
app.use((err, req, res, next) => {
    // console.log(err.stack)
    if (err.name === 'ValidationError') {
        err.message = Object.values(err.errors).map((item) => item.message)[0]
    }
    if (err.name === 'CastError'){
        err.message = `No item found with id: {err.value}`
    }
    if (err.code && err.code === 11000) {
        err.message = `Duplicate value entered for ${Object.keys(err.keyValue)} field, please choose another value`
    }
    const message = err.message || 'Server cannot respond at this time'
    const statuscode = err.status || StatusCodes.INTERNAL_SERVER_ERROR
    res.status(statuscode).json({message: message});
})


async function startServer() {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to Mongo DB')
    app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer()