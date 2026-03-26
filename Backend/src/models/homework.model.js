const mongoose = require('mongoose');

const homeworkSchema = new mongoose.Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'School',
        required: true,
    },
    title: {
        type: String,
        required: [true, 'Homework title is required'],
        trim: true,
    },
    description: {
        type: String,
        required: [true, 'Homework description is required'],
    },
    class: {
        type: String,
        required: [true, 'Class is required'],
    },
    section: {
        type: String,
        required: [true, 'Section is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
    },
    dueDate: {
        type: Date,
        required: [true, 'Due date is required'],
    },
    attachments: [{
        name: String,
        url: String,
        publicId: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Homework', homeworkSchema);
