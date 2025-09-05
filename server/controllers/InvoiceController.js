import Invoice from '../models/Invoice.js';
import Inventory from '../models/Inventory.js';
import Prescription from '../models/Prescription.js';

// Generate unique invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${timestamp}-${random}`;
};

// Auto-generate invoice from prescription
export const generateInvoiceForPrescription = async (prescription) => {
  try {
    const invoiceItems = [];
    let subtotal = 0;

    // Process each medicine and check availability
    for (const med of prescription.prescribedMedicines) {
      const inventoryItem = await Inventory.findById(med.medicineId);
      
      let availability = 'unavailable';
      let availableQuantity = 0;
      
      if (inventoryItem) {
        availableQuantity = inventoryItem.quantity;
        if (inventoryItem.quantity >= med.quantity) {
          availability = 'available';
        } else if (inventoryItem.quantity > 0) {
          availability = 'partial';
        }
      }

      const itemTotal = med.price * med.quantity;
      invoiceItems.push({
        medicineId: med.medicineId,
        medicineName: med.medicineName,
        unitPrice: med.price,
        quantity: med.quantity,
        total: itemTotal,
        availability,
        availableQuantity
      });

      // Only add to subtotal if medicine is available (full or partial)
      if (availability !== 'unavailable') {
        subtotal += itemTotal;
      }
    }

    const tax = subtotal * 0.1; // 10% tax
    const totalAmount = subtotal + tax;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

    const invoice = new Invoice({
      invoiceNumber: generateInvoiceNumber(),
      patient: prescription.patient,
      prescription: prescription._id,
      items: invoiceItems,
      subtotal,
      tax,
      totalAmount,
      dueDate
    });

    await invoice.save();
    return invoice;
  } catch (err) {
    throw new Error(`Invoice generation failed: ${err.message}`);
  }
};

// Get all invoices
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('patient', 'name email phoneNumber')
      .populate('prescription', 'disease doctor')
      .populate({
        path: 'prescription',
        populate: {
          path: 'doctor',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get invoice by ID
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('patient')
      .populate({
        path: 'prescription',
        populate: {
          path: 'doctor',
          select: 'name'
        }
      });
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get invoice by prescription ID
export const getInvoiceByPrescription = async (req, res) => {
  try {
    const { prescriptionId } = req.params;
    const invoice = await Invoice.findOne({ prescription: prescriptionId })
      .populate('patient', 'name email phoneNumber')
      .populate('prescription')
      .populate('items.medicineId', 'name price quantity');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found for this prescription' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice by prescription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update invoice status
export const updateInvoiceStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const updateData = { status };
    
    // If marking as paid, add payment date
    if (status === 'paid') {
      updateData.paidDate = new Date();
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    res.json(invoice);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get invoices by patient
export const getInvoicesByPatient = async (req, res) => {
  try {
    const invoices = await Invoice.find({ patient: req.params.patientId })
      .populate('patient', 'name email phoneNumber')
      .populate('prescription', 'disease doctor')
      .populate({
        path: 'prescription',
        populate: {
          path: 'doctor',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get invoices by status
export const getInvoicesByStatus = async (req, res) => {
  try {
    const invoices = await Invoice.find({ status: req.params.status })
      .populate('patient', 'name email phoneNumber')
      .populate('prescription', 'disease doctor')
      .populate({
        path: 'prescription',
        populate: {
          path: 'doctor',
          select: 'name'
        }
      })
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get patient invoices (for patient access)
export const getPatientInvoices = async (req, res) => {
  try {
    const patientId = req.user.id; // Assuming user is authenticated and is a patient
    
    const invoices = await Invoice.find({ patient: patientId })
      .populate('patient', 'name email')
      .populate('prescription', 'disease prescribedMedicines')
      .sort({ createdAt: -1 });
    
    res.json(invoices);
  } catch (error) {
    console.error('Get patient invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Process payment with distribution to admin and doctor
export const processPayment = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { paymentMethod, amount } = req.body;
    
    const invoice = await Invoice.findById(invoiceId).populate('prescription');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    if (!invoice.prescription) {
      return res.status(400).json({ message: 'Prescription not found for this invoice' });
    }
    
    // Calculate payment distribution
    const totalAmount = invoice.totalAmount;
    const hospitalFee = invoice.hospitalFee || 0; // Admin gets hospital fee
    const doctorAmount = totalAmount - hospitalFee; // Doctor gets the rest
    
    // Mock payment processing
    const paymentStatus = 'completed';
    const paidAmount = amount || totalAmount;
    
    // Update invoice with payment details
    invoice.status = 'paid';
    invoice.paymentMethod = paymentMethod;
    invoice.paidAmount = paidAmount;
    invoice.paidDate = new Date();
    
    // Update prescription status
    invoice.prescription.status = 'completed';
    await invoice.prescription.save();
    
    await invoice.save();
    
    // Log payment distribution for admin tracking
    console.log('Payment Distribution:', {
      invoiceId: invoice._id,
      totalAmount,
      hospitalFee: hospitalFee, // Admin portion
      doctorAmount: doctorAmount, // Doctor portion
      paymentMethod,
      paidAt: new Date()
    });
    
    res.json({ 
      message: 'Payment processed successfully',
      paymentStatus,
      paidAmount,
      invoiceNumber: invoice.invoiceNumber,
      distribution: {
        totalAmount,
        hospitalFee: hospitalFee,
        doctorAmount: doctorAmount
      }
    });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get financial reports
export const getFinancialReports = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter = {};
    if (startDate) dateFilter.createdAt = { $gte: new Date(startDate) };
    if (endDate) {
      dateFilter.createdAt = { 
        ...dateFilter.createdAt, 
        $lte: new Date(endDate) 
      };
    }
    
    // Get revenue data
    const invoices = await Invoice.find(dateFilter);
    
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const totalTax = invoices.reduce((sum, inv) => sum + (inv.tax || 0), 0);
    const totalHospitalFee = invoices.reduce((sum, inv) => sum + (inv.hospitalFee || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.paymentStatus === 'completed');
    const pendingInvoices = invoices.filter(inv => inv.paymentStatus !== 'completed');
    
    const paidRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const pendingRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    res.json({
      totalRevenue,
      totalTax,
      totalHospitalFee,
      paidRevenue,
      pendingRevenue,
      totalInvoices: invoices.length,
      paidInvoices: paidInvoices.length,
      pendingInvoices: pendingInvoices.length,
      averageInvoiceValue: invoices.length > 0 ? totalRevenue / invoices.length : 0
    });
  } catch (error) {
    console.error('Get financial reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get invoice statistics
export const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$tax' },
          totalHospitalFee: { $sum: '$hospitalFee' },
          averageInvoiceValue: { $avg: '$totalAmount' }
        }
      }
    ]);
    
    const paymentStats = await Invoice.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);
    
    res.json({
      overview: stats[0] || {
        totalInvoices: 0,
        totalRevenue: 0,
        totalTax: 0,
        totalHospitalFee: 0,
        averageInvoiceValue: 0
      },
      paymentBreakdown: paymentStats
    });
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
