# 🔬 Complete API Testing Guide - Doctor & Admin Endpoints

## 🚀 Setup Instructions

### 1. Start the Server
```bash
cd v3/server
npm run dev
```
**Server runs on:** `http://localhost:5000`

### 2. Postman/Thunder Client Setup
- **Base URL**: `http://localhost:5000`
- **Content-Type**: `application/json` (for all requests)

---

## 🔐 Authentication Overview

### Token Types:
1. **Admin Token**: Use `Bearer {admin_token}` in Authorization header
2. **Doctor Token**: Use `Bearer {doctor_token}` in Authorization header

### How to Get Tokens:
1. **Admin**: Login via `/api/admin/login`
2. **Doctor**: Login via `/api/doctor/auth/login`

---

## 👨‍💼 ADMIN APIs

### 🔑 Authentication

#### 1. Admin Login
```http
POST http://localhost:5000/api/admin/login
Content-Type: application/json

{
  "name": "admin",
  "password": "123456"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin_id_here",
    "name": "admin",
    "role": "admin"
  }
}
```

**⚠️ Common Mistake**: Using `email` instead of `name` field

---

### 👤 Admin Profile

#### 2. Get Admin Profile
```http
GET http://localhost:5000/api/admin/profile
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
{
  "_id": "admin_id",
  "name": "admin",
  "role": "admin",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 👨‍⚕️ Doctor Management

#### 3. List All Doctors
```http
GET http://localhost:5000/api/admin/doctors
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
[
  {
    "_id": "doctor_id",
    "user": {
      "_id": "user_id",
      "name": "Dr. John Smith",
      "email": "john@example.com"
    },
    "specialty": "Cardiology",
    "isAvailable": true
  }
]
```

#### 4. Get Specific Doctor
```http
GET http://localhost:5000/api/admin/doctors/{doctor_id}
Authorization: Bearer {admin_token}
```

#### 5. Update Doctor
```http
PUT http://localhost:5000/api/admin/doctors/{doctor_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "specialty": "Neurology",
  "isAvailable": true
}
```

#### 6. Delete Doctor
```http
DELETE http://localhost:5000/api/admin/doctors/{doctor_id}
Authorization: Bearer {admin_token}
```

#### 7. Set Doctor Working Hours
```http
PATCH http://localhost:5000/api/admin/doctors/{doctor_id}/working-hours
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "monday": {
    "start": "09:00",
    "end": "17:00"
  },
  "tuesday": {
    "start": "09:00", 
    "end": "17:00"
  }
}
```

---

### 👥 Staff Management

#### 8. List All Staff
```http
GET http://localhost:5000/api/admin/staff
Authorization: Bearer {admin_token}
```

#### 9. Get Specific Staff
```http
GET http://localhost:5000/api/admin/staff/{staff_id}
Authorization: Bearer {admin_token}
```

#### 10. Update Staff
```http
PUT http://localhost:5000/api/admin/staff/{staff_id}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "department": "Emergency",
  "isAvailable": true
}
```

#### 11. Delete Staff
```http
DELETE http://localhost:5000/api/admin/staff/{staff_id}
Authorization: Bearer {admin_token}
```

#### 12. Set Staff Working Hours
```http
PATCH http://localhost:5000/api/admin/staff/{staff_id}/working-hours
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "monday": {
    "start": "08:00",
    "end": "16:00"
  }
}
```

---

### 📅 Slot Request Management

#### 13. List Pending Slot Requests
```http
GET http://localhost:5000/api/admin/slot-requests
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
[
  {
    "_id": "slot_request_id",
    "doctor": {
      "_id": "doctor_id",
      "user": {
        "name": "Dr. John Smith"
      }
    },
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "pending"
  }
]
```

#### 14. Approve Slot Request
```http
POST http://localhost:5000/api/admin/slot-requests/{request_id}/approve
Authorization: Bearer {admin_token}
```

#### 15. Reject Slot Request
```http
POST http://localhost:5000/api/admin/slot-requests/{request_id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rejectionReason": "Conflicting schedule"
}
```

---

### 🏖️ Leave Request Management

#### 16. List Pending Leave Requests
```http
GET http://localhost:5000/api/admin/leave-requests
Authorization: Bearer {admin_token}
```

**Expected Response:**
```json
[
  {
    "_id": "leave_request_id",
    "doctor": {
      "_id": "doctor_id",
      "user": {
        "name": "Dr. John Smith"
      }
    },
    "startDate": "2024-01-20",
    "endDate": "2024-01-25",
    "reason": "Vacation",
    "status": "pending"
  }
]
```

#### 17. Approve Leave Request
```http
POST http://localhost:5000/api/admin/leave-requests/{request_id}/approve
Authorization: Bearer {admin_token}
```

#### 18. Reject Leave Request
```http
POST http://localhost:5000/api/admin/leave-requests/{request_id}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "rejectionReason": "Insufficient coverage"
}
```

---

## 👨‍⚕️ DOCTOR APIs

### 🔑 Authentication

#### 19. Doctor Registration
```http
POST http://localhost:5000/api/doctor/auth/register
Content-Type: application/json

{
  "name": "Dr. Jane Doe",
  "email": "jane.doe@hospital.com",
  "password": "securepassword123",
  "specialty": "Cardiology"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "_id": "doctor_id",
    "user": {
      "_id": "user_id", 
      "name": "Dr. Jane Doe",
      "email": "jane.doe@hospital.com"
    },
    "specialty": "Cardiology"
  }
}
```

#### 20. Doctor Login
```http
POST http://localhost:5000/api/doctor/auth/login
Content-Type: application/json

{
  "email": "jane.doe@hospital.com",
  "password": "securepassword123"
}
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "doctor": {
    "_id": "doctor_id",
    "user": {
      "_id": "user_id",
      "name": "Dr. Jane Doe", 
      "email": "jane.doe@hospital.com"
    },
    "specialty": "Cardiology"
  },
  "nextPath": "/doctor"
}
```

---

### 👥 Patient Management

#### 21. Get Doctor's Patients
```http
GET http://localhost:5000/api/doctor/patients
Authorization: Bearer {doctor_token}
```

**Expected Response:**
```json
[
  {
    "_id": "patient_id",
    "name": "John Patient",
    "email": "john@example.com",
    "bloodGroup": "A+",
    "appointments": [
      {
        "_id": "appointment_id",
        "date": "2024-01-15",
        "time": "10:00"
      }
    ]
  }
]
```

---

### 📅 Time Slot Management

#### 22. Get Doctor's Time Slots
```http
GET http://localhost:5000/api/doctor/timeslots
Authorization: Bearer {doctor_token}
```

#### 23. Request New Appointment Slot
```http
POST http://localhost:5000/api/doctor/slot-requests
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "date": "2024-01-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "recurring": false
}
```

**Expected Response:**
```json
{
  "_id": "slot_request_id",
  "doctor": "doctor_id",
  "date": "2024-01-20",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 24. Get My Slot Requests
```http
GET http://localhost:5000/api/doctor/slot-requests
Authorization: Bearer {doctor_token}
```

#### 25. Mark Time Slot Unavailable
```http
PATCH http://localhost:5000/api/doctor/timeslots/{slot_id}/unavailable
Authorization: Bearer {doctor_token}
```

---

### 🏖️ Leave Request Management

#### 26. Get My Leave Requests
```http
GET http://localhost:5000/api/doctor/leave-requests
Authorization: Bearer {doctor_token}
```

#### 27. Request Leave
```http
POST http://localhost:5000/api/doctor/leave-requests
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "startDate": "2024-02-01",
  "endDate": "2024-02-05",
  "reason": "Medical Conference",
  "isEmergency": false
}
```

**Expected Response:**
```json
{
  "_id": "leave_request_id",
  "doctor": "doctor_id",
  "startDate": "2024-02-01",
  "endDate": "2024-02-05", 
  "reason": "Medical Conference",
  "status": "pending",
  "isEmergency": false
}
```

#### 28. Update Leave Request
```http
PUT http://localhost:5000/api/doctor/leave-requests/{request_id}
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "reason": "Updated: Medical Conference and Training"
}
```

#### 29. Cancel Leave Request
```http
DELETE http://localhost:5000/api/doctor/leave-requests/{request_id}
Authorization: Bearer {doctor_token}
```

---

### 💊 Prescription Management

#### 30. Create Prescription
```http
POST http://localhost:5000/api/doctor/prescriptions
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "patient": "patient_id",
  "medications": [
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "Twice daily",
      "duration": "7 days"
    }
  ],
  "diagnosis": "Mild fever",
  "notes": "Take with food"
}
```

**Expected Response:**
```json
{
  "_id": "prescription_id",
  "doctor": "doctor_id",
  "patient": "patient_id", 
  "medications": [
    {
      "name": "Aspirin",
      "dosage": "100mg",
      "frequency": "Twice daily",
      "duration": "7 days"
    }
  ],
  "diagnosis": "Mild fever",
  "notes": "Take with food",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 31. Get My Prescriptions
```http
GET http://localhost:5000/api/doctor/prescriptions
Authorization: Bearer {doctor_token}
```

#### 32. Get Specific Prescription
```http
GET http://localhost:5000/api/doctor/prescriptions/{prescription_id}
Authorization: Bearer {doctor_token}
```

#### 33. Update Prescription
```http
PUT http://localhost:5000/api/doctor/prescriptions/{prescription_id}
Authorization: Bearer {doctor_token}
Content-Type: application/json

{
  "notes": "Updated: Take with food, avoid alcohol"
}
```

#### 34. Cancel Prescription
```http
DELETE http://localhost:5000/api/doctor/prescriptions/{prescription_id}
Authorization: Bearer {doctor_token}
```

#### 35. Get Patient's Prescription History
```http
GET http://localhost:5000/api/doctor/patients/{patient_id}/prescriptions
Authorization: Bearer {doctor_token}
```

---

## 🚨 Common Mistakes & Troubleshooting

### ❌ Authentication Errors

**1. "No token. Access denied"**
- **Cause**: Missing `Authorization` header
- **Fix**: Add `Authorization: Bearer {your_token}`

**2. "Token failed or expired"**
- **Cause**: Invalid or expired token
- **Fix**: Login again to get new token

**3. "Not authorized as admin"**
- **Cause**: Using doctor token for admin endpoints
- **Fix**: Use admin token from admin login

### ❌ Request Errors

**4. "Invalid credentials" (Admin Login)**
- **Cause**: Using `email` instead of `name`
- **Fix**: Use `"name": "admin"` not `"email"`

**5. "Doctor not found"**
- **Cause**: Invalid doctor ID in URL
- **Fix**: Use correct doctor ID from list doctors API

**6. "ValidationError"**
- **Cause**: Missing required fields
- **Fix**: Check required fields in JSON body

### ❌ JSON Errors

**7. "Unexpected token in JSON"**
- **Cause**: Malformed JSON
- **Fix**: Validate JSON syntax

**8. "Content-Type not supported"**
- **Cause**: Missing Content-Type header
- **Fix**: Add `Content-Type: application/json`

### ❌ Server Errors

**9. "Cannot connect to server"**
- **Cause**: Server not running
- **Fix**: Start server with `npm run dev`

**10. "CORS error"**
- **Cause**: Cross-origin request issue
- **Fix**: Server already configured for CORS

---

## 🔧 Quick Testing Checklist

### ✅ Before Testing:
1. ☑️ Server running on port 5000
2. ☑️ MongoDB connected
3. ☑️ Admin user exists (run seedAdmin.js)
4. ☑️ Content-Type: application/json set

### ✅ Test Order:
1. **Admin Login** → Get admin token
2. **Test admin endpoints** with admin token
3. **Doctor Registration** → Get doctor token  
4. **Test doctor endpoints** with doctor token

### ✅ Token Management:
- Store tokens as variables in Postman
- Tokens expire (Admin: 8h, Doctor: 30d)
- Use fresh tokens if getting auth errors

---

## 📝 Postman Collection Setup

### Environment Variables:
```
base_url: http://localhost:5000
admin_token: {{admin_token_from_login}}
doctor_token: {{doctor_token_from_login}}
```

### Pre-request Scripts:
```javascript
// For admin endpoints
pm.request.headers.add({
    key: 'Authorization',
    value: 'Bearer ' + pm.environment.get('admin_token')
});
```

---

## 🎯 Success Indicators

### ✅ All APIs Working When:
1. **Admin login** returns token
2. **Doctor registration** creates account
3. **Protected endpoints** accept tokens
4. **CRUD operations** work as expected
5. **Error responses** are meaningful

**🎉 Happy Testing! Your Hospital Management System APIs are ready for action!**
