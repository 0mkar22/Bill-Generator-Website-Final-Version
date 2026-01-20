const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  entryNumber: {
    type: String,
    required: true,
    maxLength: 5
  },
  eventDate: {
    type: Date,
    required: true
  },
  vendor: {
    type: String,
    required: true,
    enum: ['ICOMP SYSTEMS', 'STUDIO VISION', 'WAGHSONS PHOTO VISION']
  },
  workItems: [{
    eventName: {
      type: String,
      required: true
    },
    poNpo: {
      type: String,
      required: true,
      enum: ['PO', 'NPO']
    },
    eventTime: {
      type: String,
      required: true
    },
    eventVenue: {
      type: String,
      required: true
    },
    contactPerson: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true,
      maxLength: 10
    },
    workMain: {
      type: String,
      required: true
    },
    workSub: {
      type: String
    },
    quantity: {
        type: Number,
        default: 1
    },
    customVenue: String,
    customWorkMain: String,
    billGenerated: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);