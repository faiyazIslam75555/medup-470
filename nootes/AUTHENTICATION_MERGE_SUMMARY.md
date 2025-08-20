# Authentication System Merge Summary

## Overview
Successfully merged authentication systems from both projects into v3 (shoumik), creating a comprehensive authentication system that supports:

- **Admin Authentication**: JWT-based admin authentication with role-based access control
- **Doctor Authentication**: Complete doctor registration, login, and management system  
- **Staff Authentication**: Complete staff registration, login, and management system
- **User/Patient Authentication**: User registration and login for patients

## Key Features Merged

### 1. Admin Authentication
- **File**: `server/middleware/adminAuthMiddleware.js`
- **Features**:
  - Production-ready JWT authentication
  - Development mode bypass (when NODE_ENV=development)
  - Role verification (admin role required)
  - Token validation and user attachment

### 2. Comprehensive Auth Middleware
- **File**: `server/middleware/auth.js`
- **Features**:
  - `protect`: Main authentication middleware for users
  - `loadDoctor`: Middleware to load doctor profile and attach doctorId
  - `loadStaff`: Middleware to load staff profile and attach staffId
  - `requireRole`: Role-based access control middleware
  - `authenticateDoctor`: Combined middleware for doctor authentication
  - `authenticateStaff`: Combined middleware for staff authentication
  - `authenticatePatient`: Middleware for patient-only access

### 3. Enhanced Admin Controller
- **File**: `server/controllers/AdminController.js`
- **Features**:
  - Admin login with JWT token generation
  - Admin profile management
  - Complete doctor management (list, get, update, delete, working hours)
  - Complete staff management (list, get, update, delete, working hours)
  - Time slot request management (approve/reject)
  - Leave request management (approve/reject with comments)

### 4. Doctor Authentication & Features
- **Controller**: `server/controllers/doctorController.js`
- **Routes**: `server/routes/doctor.js`
- **Features**:
  - Doctor registration and login
  - Patient management
  - Time slot management
  - Leave request system
  - Prescription management (existing)

### 5. Staff Authentication & Features
- **Controller**: `server/controllers/staffController.js`
- **Routes**: `server/routes/staff.js`
- **Features**:
  - Staff registration and login
  - Staff profile management
  - Leave request system

## Route Structure

### Admin Routes (`/api/admin`)
```
POST   /login                          # Admin login
GET    /profile                        # Admin profile (protected)
GET    /doctors                        # List doctors (protected)
GET    /doctors/:id                    # Get doctor details (protected)
PUT    /doctors/:id                    # Update doctor (protected)
DELETE /doctors/:id                    # Delete doctor (protected)
PATCH  /doctors/:id/working-hours      # Set doctor working hours (protected)
GET    /staff                          # List staff (protected)
GET    /staff/:id                      # Get staff details (protected)
PUT    /staff/:id                      # Update staff (protected)
DELETE /staff/:id                      # Delete staff (protected)
PATCH  /staff/:id/working-hours        # Set staff working hours (protected)
GET    /slot-requests                  # List pending slot requests (protected)
POST   /slot-requests/:id/approve      # Approve slot request (protected)
POST   /slot-requests/:id/reject       # Reject slot request (protected)
GET    /leave-requests                 # List leave requests (protected)
POST   /leave-requests/:id/approve     # Approve leave request (protected)
POST   /leave-requests/:id/reject      # Reject leave request (protected)
```

### Doctor Routes (`/api/doctor`)
```
POST   /auth/register                  # Doctor registration
POST   /auth/login                     # Doctor login
GET    /patients                       # Get doctor's patients (protected)
GET    /timeslots                      # Get doctor's time slots (protected)
GET    /slot-requests                  # Get doctor's slot requests (protected)
POST   /slot-requests                  # Request new time slot (protected)
PATCH  /timeslots/:id/unavailable      # Mark slot unavailable (protected)
GET    /leave-requests                 # Get doctor's leave requests (protected)
POST   /leave-requests                 # Submit leave request (protected)
PUT    /leave-requests/:id             # Update leave request (protected)
DELETE /leave-requests/:id             # Cancel leave request (protected)
```

### Staff Routes (`/api/staff`)
```
POST   /auth/register                  # Staff registration
POST   /auth/login                     # Staff login
GET    /profile                        # Staff profile (protected)
GET    /leave-requests                 # Get staff's leave requests (protected)
POST   /leave-requests                 # Submit leave request (protected)
PUT    /leave-requests/:id             # Update leave request (protected)
DELETE /leave-requests/:id             # Cancel leave request (protected)
```

## Authentication Flow

### Admin Authentication
1. Admin logs in with username/password → receives JWT token
2. Token must be included in Authorization header as `Bearer <token>`
3. Admin middleware verifies token and admin role
4. Admin can access all management endpoints

### Doctor/Staff Authentication
1. Doctor/Staff registers with email/password → creates User and Doctor/Staff records
2. Doctor/Staff logs in with email/password → receives JWT token
3. Token must be included in Authorization header as `Bearer <token>`
4. Auth middleware verifies token and loads doctor/staff profile
5. Doctor/Staff can access their respective protected endpoints

### User/Patient Authentication
1. User registers with email/password → creates User record
2. User logs in with email/password → receives JWT token
3. Token must be included in Authorization header as `Bearer <token>`
4. Auth middleware verifies token and user role
5. User can access patient endpoints

## Security Features

1. **JWT Token Security**: All tokens have expiration times (2-8 hours)
2. **Password Hashing**: All passwords are hashed using bcrypt
3. **Role-based Access Control**: Strict role verification for all protected routes
4. **Environment-based Auth**: Development mode can bypass admin auth for testing
5. **Input Validation**: Comprehensive validation for all authentication endpoints

## Usage Examples

### Admin Login
```javascript
POST /api/admin/login
{
  "name": "admin",
  "password": "adminpassword"
}
```

### Doctor Registration
```javascript
POST /api/doctor/auth/register
{
  "name": "Dr. Smith",
  "email": "smith@hospital.com",
  "password": "password123",
  "phoneNumber": "1234567890",
  "specialty": "Cardiology"
}
```

### Staff Login
```javascript
POST /api/staff/auth/login
{
  "email": "staff@hospital.com",
  "password": "password123"
}
```

## Database Models

The authentication system works with these models:
- **Admin**: Admin user accounts
- **User**: Base user accounts (patients, doctors, staff)
- **Doctor**: Doctor profiles linked to User accounts
- **Staff**: Staff profiles linked to User accounts
- **TimeSlot**: Doctor time slot management
- **LeaveRequest**: Leave request management for doctors and staff

## Configuration

Set environment variables:
- `JWT_SECRET`: Secret key for JWT token signing
- `NODE_ENV`: Set to 'development' to bypass admin authentication
- `JWT_EXPIRES_IN`: Token expiration time (optional, defaults to 1h)

## Testing

The merged authentication system supports:
1. **Development Mode**: Admin authentication can be bypassed for testing
2. **Production Mode**: Full authentication enforcement
3. **Role Separation**: Clear separation between admin, doctor, staff, and patient roles
4. **Token Management**: Proper JWT token lifecycle management

This comprehensive authentication system provides secure, role-based access control for all user types in the hospital management system.
