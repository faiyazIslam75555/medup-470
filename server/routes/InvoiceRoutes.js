import express from 'express';
import { 
  getAllInvoices, 
  getInvoiceById, 
  getInvoiceByPrescription,
  updateInvoiceStatus,
  getInvoicesByPatient,
  getInvoicesByStatus,
  deleteInvoice,
  getPatientInvoices,
  processPayment,
  getFinancialReports,
  getInvoiceStats
} from '../controllers/InvoiceController.js';

const router = express.Router();

// =================== ADMIN/STAFF ROUTES ======================

// Get all invoices (admin/staff)
router.get('/', getAllInvoices);

// Get invoices by patient (admin/staff)
router.get('/patient/:patientId', getInvoicesByPatient);

// Get invoices by status (admin/staff)
router.get('/status/:status', getInvoicesByStatus);

// Get specific invoice (admin/staff)
router.get('/:id', getInvoiceById);

// Get invoice by prescription ID
router.get('/prescription/:prescriptionId', getInvoiceByPrescription);

// Update invoice status (admin/staff)
router.put('/:id/status', updateInvoiceStatus);

// Delete invoice (admin/staff)
router.delete('/:id', deleteInvoice);

// =================== FINANCIAL REPORTS ======================

// Get financial reports (admin only)
router.get('/reports/financial', getFinancialReports);

// Get invoice statistics (admin only)
router.get('/reports/stats', getInvoiceStats);

// =================== PATIENT ROUTES ======================

// Get patient's own invoices (patient access)
router.get('/my-invoices', getPatientInvoices);

// Process payment for invoice (patient)
router.post('/:invoiceId/pay', processPayment);

export default router;
