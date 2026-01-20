const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  // --- THIS IS THE NEW FIELD ---
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceType: {
    type: String,
    required: true,
    enum: ['WorkOrder', 'Vendor']
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  workItems: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkOrder.workItems' 
  }],
  parentOrderInfo: {
      entryNumber: String,
      vendor: String,
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);