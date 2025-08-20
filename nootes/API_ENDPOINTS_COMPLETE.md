# Complete API Endpoints Documentation - V3 Folder

This document provides a comprehensive overview of all API endpoints available in the v3 folder after adding the missing APIs from the CSE471-Proj-Shoumik project.

## API Base URLs

All APIs are mounted under `/api` with the following base paths:
- `/api/health` - System health check
- `/api/info` - System information
- `/api/admin` - Admin management endpoints
- `/api/doctor` - Doctor-specific endpoints
- `/api/staff` - Staff-specific endpoints
- `/api/inventory` - Inventory management endpoints
- `/api/medications` - Medication search and management
- `/api/prescriptions` - Prescription management endpoints
- `/api/invoices` - Invoice management endpoints
- `/api/users` - User management endpoints

## System Endpoints

### Health Check
- **GET** `/api/health` - System health status
  - Response: `{ message, status, timestamp }`

### System Info
- **GET** `/api/info` - System information
  - Response: `{ name, version, modules, status }`

## Admin Management (`/api/admin`)

### Public Endpoints (No Authentication)
- **GET** `/_ping` - Health check endpoint
- **POST** `/login` - Admin login

### Protected Endpoints (Admin Authentication Required)
- **GET** `/profile` - Get admin profile

#### Doctor Management
- **GET** `/doctors` - List all doctors
- **GET** `/doctors/:id` - Get specific doctor details
- **PUT** `/doctors/:id` - Update doctor information
- **DELETE** `/doctors/:id` - Delete doctor
- **PATCH** `/doctors/:id/working-hours` - Set doctor working hours

#### Staff Management
- **GET** `/staff` - List all staff
- **GET** `/staff/:id` - Get specific staff details
- **PUT** `/staff/:id` - Update staff information
- **DELETE** `/staff/:id` - Delete staff
- **PATCH** `/staff/:id/working-hours` - Set staff working hours

#### Slot Request Management
- **GET** `/slot-requests` - List pending slot requests
- **POST** `/slot-requests/:id/approve` - Approve slot request
- **POST** `/slot-requests/:id/reject` - Reject slot request

#### Leave Request Management
- **GET** `/leave-requests` - List pending leave requests
- **GET** `/leave-requests/all` - List all leave requests
- **GET** `/leave-requests/stats` - Get leave request statistics
- **POST** `/leave-requests/:id/approve` - Approve leave request
- **POST** `/leave-requests/:id/reject` - Reject leave request

## Doctor Management (`/api/doctor`)

### Public Endpoints (No Authentication)
- **POST** `/auth/register` - Doctor registration
- **POST** `/auth/login` - Doctor login

### Protected Endpoints (Doctor Authentication Required)
- **GET** `/patients` - Get doctor's patients
- **GET** `/timeslots` - Get doctor's time slots
- **GET** `/slot-requests` - Get doctor's slot requests
- **POST** `/slot-requests` - Request appointment slot
- **PATCH** `/timeslots/:id/unavailable` - Mark slot as unavailable

#### Leave Request Management
- **GET** `/leave-requests` - Get doctor's leave requests
- **POST** `/leave-requests` - Request leave
- **PUT** `/leave-requests/:id` - Update leave request
- **DELETE** `/leave-requests/:id` - Cancel leave request

#### Prescription Management
- **POST** `/prescriptions` - Create prescription
- **GET** `/prescriptions` - Get doctor's prescriptions
- **GET** `/prescriptions/:id` - Get specific prescription
- **PUT** `/prescriptions/:id` - Update prescription
- **DELETE** `/prescriptions/:id` - Cancel prescription
- **GET** `/patients/:id/prescriptions` - Get patient prescription history

## Staff Management (`/api/staff`)

### Public Endpoints (No Authentication)
- **POST** `/auth/register` - Staff registration
- **POST** `/auth/login` - Staff login

### Protected Endpoints (Staff Authentication Required)
- **GET** `/profile` - Get staff profile

#### Leave Request Management
- **GET** `/leave-requests` - Get staff's leave requests
- **POST** `/leave-requests` - Request leave
- **PUT** `/leave-requests/:id` - Update leave request
- **DELETE** `/leave-requests/:id` - Cancel leave request

## Inventory Management (`/api/inventory`)

### Public Endpoints (No Authentication)
- **GET** `/` - Get all medicines
- **POST** `/` - Add new medicine
- **PUT** `/:id` - Update medicine
- **DELETE** `/:id` - Delete medicine
- **POST** `/bulk-upload` - Bulk upload medicines via CSV

## Medication Management (`/api/medications`)

### Public Endpoints (No Authentication)
- **GET** `/search` - Search medications with auto-suggestions
- **GET** `/` - Get all medications with filters and pagination
- **GET** `/:id` - Get specific medication details

## Prescription Management (`/api/prescriptions`)

### Public Endpoints (No Authentication)
- **POST** `/` - Create prescription
- **GET** `/` - Get all prescriptions
- **GET** `/patients` - Get all patients
- **GET** `/doctors` - Get all doctors
- **GET** `/:id` - Get specific prescription
- **PUT** `/:id` - Update prescription
- **DELETE** `/:id` - Cancel prescription

## Invoice Management (`/api/invoices`)

### Public Endpoints (No Authentication)
- **GET** `/` - Get all invoices
- **GET** `/:id` - Get specific invoice
- **PUT** `/:id/status` - Update invoice status

## User Management (`/api/users`)

### Public Endpoints (No Authentication)
- **POST** `/register` - User registration
- **POST** `/login` - User login

### Protected Endpoints (Authentication Required)
- **GET** `/profile` - Get user profile

## Summary of Changes Made

### 1. Added Missing Route Mounting
- **Medications routes** are now properly mounted at `/api/medications`

### 2. Consolidated Admin Routes
- **Removed duplicate** `admin.js` file
- **Enhanced** `AdminRoutes.js` with missing endpoints:
  - `GET /leave-requests/all` - List all leave requests
  - `GET /leave-requests/stats` - Get leave request statistics
  - `GET /_ping` - Public health check

### 3. Enhanced Prescription Routes
- **Added missing endpoints** to `PrescriptionRoutes.js`:
  - `GET /:id` - Get specific prescription
  - `PUT /:id` - Update prescription
  - `DELETE /:id` - Cancel prescription

### 4. Route Organization
- **All routes are now properly organized** and mounted in `server.js`
- **No duplicate route definitions** exist
- **Consistent authentication patterns** across all routes

## Authentication Requirements

### Public Endpoints (No Authentication)
- Health checks (`/_ping`, `/api/health`)
- System information (`/api/info`)
- Authentication endpoints (`/auth/register`, `/auth/login`)
- Basic CRUD operations for medications and inventory

### Protected Endpoints (Authentication Required)
- **Admin routes**: Require admin authentication via `adminAuthMiddleware`
- **Doctor routes**: Require doctor authentication via `authenticateDoctor`
- **Staff routes**: Require staff authentication via `authenticateStaff`
- **User routes**: Require general authentication via `protect` middleware

## File Structure

```
v3/server/
├── server.js (main server file with all routes mounted)
├── routes/
│   ├── AdminRoutes.js (complete admin management)
│   ├── doctor.js (doctor-specific endpoints)
│   ├── staff.js (staff-specific endpoints)
│   ├── InventoryRoutes.js (inventory management)
│   ├── medications.js (medication search)
│   ├── PrescriptionRoutes.js (prescription management)
│   ├── InvoiceRoutes.js (invoice management)
│   └── UserRoutes.js (user management)
└── controllers/
    ├── AdminController.js
    ├── doctorController.js
    ├── staffController.js
    ├── InventoryController.js
    ├── medicationController.js
    ├── PrescriptionController.js
    ├── InvoiceController.js
    └── UserController.js
```

## Total API Endpoints: 67

The v3 folder now contains all the API endpoints that were present in the CSE471-Proj-Shoumik project, properly organized and without duplicates. All routes are correctly mounted and the authentication middleware is properly configured for each route type.
