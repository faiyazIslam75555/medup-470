# Hospital Management System - API Endpoints Documentation

## Overview
This document provides a comprehensive list of all API endpoints available in the Hospital Management System backend. The system is built with Express.js and provides RESTful APIs for managing doctors, staff, patients, prescriptions, medications, and inventory.

## Base URL
```
http://localhost:5000/api
```

## Authentication
- **Protected Routes**: Require valid JWT token in Authorization header
- **Public Routes**: No authentication required
- **Format**: `Authorization: Bearer <token>`

---

## 1. Health & System Information

### Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Auth**: None
- **Response**: System status and timestamp

### API Information
- **GET** `/info`
- **Description**: Get API version and module information
- **Auth**: None
- **Response**: System name, version, and available modules

---

## 2. Admin Routes (`/admin`)

### Health Check
- **GET** `/_ping`
- **Description**: Simple health check for admin routes
- **Auth**: None
- **Response**: `{ ok: true }`

### Doctor Management
- **GET** `/doctors`
- **Description**: List all doctors
- **Auth**: None (Public endpoint)
- **Response**: Array of doctor objects

- **GET** `/doctors/:id`
- **Description**: Get specific doctor details
- **Auth**: None (Public endpoint)
- **Response**: Doctor object

- **PUT** `/doctors/:id`
- **Description**: Update doctor information
- **Auth**: None (Public endpoint)
- **Request Body**: Doctor update data
- **Response**: Updated doctor object

- **DELETE** `/doctors/:id`
- **Description**: Delete a doctor
- **Auth**: None (Public endpoint)
- **Response**: Success message

- **PATCH** `/doctors/:id/working-hours`
- **Description**: Set doctor working hours
- **Auth**: None (Public endpoint)
- **Request Body**: Working hours data
- **Response**: Updated doctor object

### Staff Management
- **GET** `/staff`
- **Description**: List all staff members
- **Auth**: None (Public endpoint)
- **Response**: Array of staff objects

- **GET** `/staff/:id`
- **Description**: Get specific staff details
- **Auth**: None (Public endpoint)
- **Response**: Staff object

- **PUT** `/staff/:id`
- **Description**: Update staff information
- **Auth**: None (Public endpoint)
- **Request Body**: Staff update data
- **Response**: Updated staff object

- **DELETE** `/staff/:id`
- **Description**: Delete a staff member
- **Auth**: None (Public endpoint)
- **Response**: Success message

- **PATCH** `/staff/:id/working-hours`
- **Description**: Set staff working hours
- **Auth**: None (Public endpoint)
- **Request Body**: Working hours data
- **Response**: Updated staff object

### Slot Request Management
- **GET** `/slot-requests`
- **Description**: List pending slot requests
- **Auth**: None (Public endpoint)
- **Response**: Array of pending slot requests

- **POST** `/slot-requests/:id/approve`
- **Description**: Approve a slot request
- **Auth**: None (Public endpoint)
- **Response**: Success message

- **POST** `/slot-requests/:id/reject`
- **Description**: Reject a slot request
- **Auth**: None (Public endpoint)
- **Response**: Success message

### Leave Request Management
- **GET** `/leave-requests`
- **Description**: List pending leave requests
- **Auth**: None (Public endpoint)
- **Response**: Array of pending leave requests

- **GET** `/leave-requests/all`
- **Description**: List all leave requests
- **Auth**: None (Public endpoint)
- **Response**: Array of all leave requests

- **GET** `/leave-requests/stats`
- **Description**: Get leave request statistics
- **Auth**: None (Public endpoint)
- **Response**: Leave request statistics

- **POST** `/leave-requests/:id/approve`
- **Description**: Approve a leave request
- **Auth**: None (Public endpoint)
- **Response**: Success message

- **POST** `/leave-requests/:id/reject`
- **Description**: Reject a leave request
- **Auth**: None (Public endpoint)
- **Response**: Success message

---

## 3. Doctor Routes (`/doctor`)

### Authentication
- **POST** `/auth/register`
- **Description**: Register a new doctor
- **Auth**: None
- **Request Body**: Doctor registration data
- **Response**: Created doctor object and token

- **POST** `/auth/login`
- **Description**: Doctor login
- **Auth**: None
- **Request Body**: Login credentials
- **Response**: Doctor object and JWT token

### Protected Doctor Endpoints
*All endpoints below require valid JWT token*

### Patient Management
- **GET** `/patients`
- **Description**: Get doctor's patients
- **Auth**: Required
- **Response**: Array of patient objects

### Time Slot Management
- **GET** `/timeslots`
- **Description**: Get doctor's time slots
- **Auth**: Required
- **Response**: Array of time slot objects

- **PATCH** `/timeslots/:id/unavailable`
- **Description**: Mark a time slot as unavailable
- **Auth**: Required
- **Request Body**: Status update
- **Response**: Updated time slot object

### Slot Requests
- **GET** `/slot-requests`
- **Description**: Get doctor's slot requests
- **Auth**: Required
- **Response**: Array of slot request objects

- **POST** `/slot-requests`
- **Description**: Request an appointment slot
- **Auth**: Required
- **Request Body**: Slot request data
- **Response**: Created slot request object

### Leave Management
- **GET** `/leave-requests`
- **Description**: Get doctor's leave requests
- **Auth**: Required
- **Response**: Array of leave request objects

- **POST** `/leave-requests`
- **Description**: Request leave
- **Auth**: Required
- **Request Body**: Leave request data
- **Response**: Created leave request object

- **PUT** `/leave-requests/:id`
- **Description**: Update leave request
- **Auth**: Required
- **Request Body**: Leave request update data
- **Response**: Updated leave request object

- **DELETE** `/leave-requests/:id`
- **Description**: Cancel leave request
- **Auth**: Required
- **Response**: Success message

### Prescription Management
- **POST** `/prescriptions`
- **Description**: Create a new prescription
- **Auth**: Required
- **Request Body**: Prescription data
- **Response**: Created prescription object

- **GET** `/prescriptions`
- **Description**: Get doctor's prescriptions
- **Auth**: Required
- **Query Parameters**: 
  - `page`: Page number
  - `limit`: Items per page
  - `sortBy`: Sort field
  - `sortOrder`: asc/desc
- **Response**: Paginated prescriptions with metadata

- **GET** `/prescriptions/:id`
- **Description**: Get specific prescription details
- **Auth**: Required
- **Response**: Prescription object

- **PUT** `/prescriptions/:id`
- **Description**: Update prescription
- **Auth**: Required
- **Request Body**: Prescription update data
- **Response**: Updated prescription object

- **DELETE** `/prescriptions/:id`
- **Description**: Cancel prescription (soft delete)
- **Auth**: Required
- **Response**: Success message

- **GET** `/patients/:id/prescriptions`
- **Description**: Get patient's prescription history
- **Auth**: Required
- **Response**: Array of prescription objects

---

## 4. Staff Routes (`/staff`)

### Authentication
- **POST** `/auth/register`
- **Description**: Register a new staff member
- **Auth**: None
- **Request Body**: Staff registration data
- **Response**: Created staff object and token

- **POST** `/auth/login`
- **Description**: Staff login
- **Auth**: None
- **Request Body**: Login credentials
- **Response**: Staff object and JWT token

### Protected Staff Endpoints
*All endpoints below require valid JWT token*

### Profile Management
- **GET** `/profile`
- **Description**: Get staff profile
- **Auth**: Required
- **Response**: Staff profile object

### Leave Management
- **GET** `/leave-requests`
- **Description**: Get staff's leave requests
- **Auth**: Required
- **Response**: Array of leave request objects

- **POST** `/leave-requests`
- **Description**: Request leave
- **Auth**: Required
- **Request Body**: Leave request data
- **Response**: Created leave request object

- **PUT** `/leave-requests/:id`
- **Description**: Update leave request
- **Auth**: Required
- **Request Body**: Leave request update data
- **Response**: Updated leave request object

- **DELETE** `/leave-requests/:id`
- **Description**: Cancel leave request
- **Auth**: Required
- **Response**: Success message

---

## 5. Inventory Routes (`/inventory`)

### Medicine Management
- **GET** `/`
- **Description**: Get all medicines
- **Auth**: None (Public endpoint)
- **Response**: Array of medicine objects

- **POST** `/`
- **Description**: Add new medicine
- **Auth**: None (Public endpoint)
- **Request Body**: Medicine data
- **Response**: Created medicine object

- **PUT** `/:id`
- **Description**: Update medicine
- **Auth**: None (Public endpoint)
- **Request Body**: Medicine update data
- **Response**: Updated medicine object

- **DELETE** `/:id`
- **Description**: Delete medicine
- **Auth**: None (Public endpoint)
- **Response**: Success message

### Bulk Operations
- **POST** `/bulk-upload`
- **Description**: Bulk upload medicines via CSV
- **Auth**: None (Public endpoint)
- **Request Body**: FormData with CSV file
- **Response**: Upload results

---

## 6. Medication Routes (`/medications`)

### Medication Search & Retrieval
- **GET** `/search`
- **Description**: Search medications with auto-suggestions
- **Auth**: None (Public endpoint)
- **Query Parameters**: Search term
- **Response**: Array of matching medications

- **GET** `/`
- **Description**: Get all medications with filters and pagination
- **Auth**: None (Public endpoint)
- **Query Parameters**: 
  - `page`: Page number
  - `limit`: Items per page
  - `category`: Filter by category
  - `type`: Filter by type
- **Response**: Paginated medications with metadata

- **GET** `/:id`
- **Description**: Get specific medication details
- **Auth**: None (Public endpoint)
- **Response**: Medication object

---

## 7. Data Models & Response Formats

### Common Response Structure
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* Response data */ },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Error Response Structure
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information"
}
```

---

## 8. Authentication Flow

### JWT Token Structure
- **Header**: `Authorization: Bearer <token>`
- **Token Format**: JWT with user role and ID
- **Expiration**: Configurable (typically 24 hours)

### Protected Route Access
1. Include JWT token in Authorization header
2. Token is validated by `protect` middleware
3. User data is loaded by role-specific middleware
4. Route handler executes with authenticated user context

---

## 9. File Upload

### CSV Upload for Inventory
- **Endpoint**: `POST /api/inventory/bulk-upload`
- **Content-Type**: `multipart/form-data`
- **File Field**: `file` (CSV format)
- **Storage**: Memory storage (buffer)
- **File Size Limit**: Based on server configuration

---

## 10. Testing & Development

### Health Check Endpoints
- `/api/health` - Main system health
- `/api/admin/_ping` - Admin routes health
- `/api/info` - System information

### Development Notes
- CORS is enabled for all origins
- JSON body parsing is enabled
- Global error handling for 500 errors
- 404 handler for undefined routes
- Environment variables loaded from `.env` file

---

## 11. Security Considerations

### Current Implementation
- JWT-based authentication
- Role-based access control
- Protected routes require valid tokens
- Public endpoints for basic operations

### Recommendations
- Implement rate limiting
- Add input validation middleware
- Enable HTTPS in production
- Implement audit logging
- Add API key management for external access

---

*This documentation covers all API endpoints as of the current implementation. For the most up-to-date information, refer to the source code and route definitions.*
