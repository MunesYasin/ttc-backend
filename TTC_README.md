# 🧠 Time Tracking & Control (TTC) System

A comprehensive NestJS backend system for employee time tracking and task management with role-based access control.

## 📋 Project Overview

This system provides:
- **Employee time tracking** with clock in/out functionality
- **Task management** with daily task submissions
- **Role-based access control** (Super Admin, Company Admin, Employee)
- **Company-specific data isolation**
- **Daily reporting** for company dashboards
- **Comprehensive REST API**

## 👥 User Roles

- **SUPER_ADMIN**: Full access to all companies and data
- **COMPANY_ADMIN**: Access to manage their company's data only
- **EMPLOYEE**: Access to their own attendance and tasks

## ⚙️ Tech Stack

- **NestJS** - Node.js framework
- **Prisma ORM** - Database ORM with MySQL
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **TypeScript** - Programming language

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env` file:
```env
DATABASE_URL="mysql://root:@localhost:3306/ttc-platform"
JWT_SECRET=supersecretkey
```

3. **Set up the database:**
```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed with sample data
npm run db:seed
```

4. **Start the development server:**
```bash
npm run start:dev
```

The server will start on `http://localhost:3000`

## 📦 Database Schema

### Models

- **User**: System users with roles
- **Company**: Company entities
- **AttendanceRecord**: Daily clock in/out records
- **Task**: Daily task submissions
- **DailyReport**: Generated company reports

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## 📚 API Endpoints

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "alice@techsolutions.com",
  "password": "employee123"
}
```

### Attendance

#### Clock In
```http
POST /attendance/clock-in
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Starting work day"
}
```

#### Clock Out
```http
POST /attendance/clock-out
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "End of work day"
}
```

#### Get Today's Attendance
```http
GET /attendance/today
Authorization: Bearer <token>
```

#### Get My Attendance Records
```http
GET /attendance/my-records?startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <token>
```

### Tasks

#### Create Task
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "user-id", // Only for Company Admin/Super Admin
  "date": "2023-07-27",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the application",
  "duration": 6.5
}
```

#### Get My Tasks
```http
GET /tasks/my-tasks?startDate=2023-01-01&endDate=2023-12-31
Authorization: Bearer <token>
```

### Company Management

#### Get Company Daily Report
```http
GET /companies/{companyId}/report/daily?date=2023-07-27
Authorization: Bearer <token>
```

### Super Admin

#### Get All Companies
```http
GET /super-admin/companies
Authorization: Bearer <token>
```

#### Get Dashboard Data
```http
GET /super-admin/dashboard
Authorization: Bearer <token>
```

## 👤 Test Accounts

The seed script creates the following test accounts:

### Super Admin
- **Email**: `superadmin@ttc.com`
- **Password**: `superadmin123`
- **Access**: All companies and data

### Company Admins
- **Tech Solutions**: `admin@techsolutions.com` / `admin123`
- **Marketing Agency**: `admin@marketingagency.com` / `admin123`
- **Access**: Their company's data only

### Employees
- **Tech Solutions**: 
  - `alice@techsolutions.com` / `employee123`
  - `bob@techsolutions.com` / `employee123`
  - `charlie@techsolutions.com` / `employee123`
- **Marketing Agency**:
  - `david@marketingagency.com` / `employee123`
  - `emma@marketingagency.com` / `employee123`
  - `frank@marketingagency.com` / `employee123`

## 🔒 Access Control

The system implements policy-based access control:

### CompanyAccessPolicy
- Super Admin: Access to all companies
- Company Admin: Access to their company only

### EmployeeAccessPolicy
- Super Admin: Access to all employees
- Company Admin: Access to employees in their company
- Employee: Access to their own data only

### AttendanceAccessPolicy
- Super Admin: All attendance records
- Company Admin: Company employees' records
- Employee: Own records only

### TaskAccessPolicy
- Super Admin: All tasks
- Company Admin: Company employees' tasks
- Employee: Own tasks only

## 📊 Example Workflows

### Employee Daily Workflow
1. **Login**: `POST /auth/login`
2. **Clock In**: `POST /attendance/clock-in`
3. **Submit Tasks**: `POST /tasks`
4. **Check Attendance**: `GET /attendance/today`
5. **Clock Out**: `POST /attendance/clock-out`

### Company Admin Dashboard
1. **Login**: `POST /auth/login`
2. **Get Daily Report**: `GET /companies/{id}/report/daily`
3. **View Company Data**: `GET /companies/{id}`

### Super Admin Overview
1. **Login**: `POST /auth/login`
2. **Dashboard**: `GET /super-admin/dashboard`
3. **All Companies**: `GET /super-admin/companies`

## 🛠️ Development Scripts

```bash
# Development
npm run start:dev        # Start development server
npm run build           # Build for production
npm run start:prod      # Start production server

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database
npm run db:migrate      # Create migration
npm run db:seed         # Seed database with sample data

# Code Quality
npm run format          # Format code with Prettier
npm run lint           # Lint code with ESLint
npm run test           # Run tests
```

## 🏗️ Architecture

### Service Layer Pattern
Each module follows the service layer pattern with:
- **Controller**: Handle HTTP requests/responses
- **Service**: Business logic and data operations
- **Policy**: Access control enforcement
- **DTO**: Data validation and transformation

### Role-Based Access Control
- Implemented using NestJS Guards and Decorators
- Policy classes enforce access rules at the service level
- JWT-based authentication with role information

### Database Design
- MySQL with Prisma ORM
- Proper indexing for performance
- Foreign key relationships for data integrity
- Unique constraints for business rules

## 📈 Features

### ✅ Implemented
- User authentication and authorization
- Role-based access control
- Attendance tracking (clock in/out)
- Task management
- Daily reporting
- Company data isolation
- RESTful API endpoints
- Database seeding
- Input validation
- Error handling

### 🚀 Future Enhancements
- Real-time notifications
- File upload for task attachments
- Advanced reporting and analytics
- Email notifications
- Mobile app support
- Integration with external calendars
- Overtime tracking
- Leave management

## 📝 License

This project is licensed under the UNLICENSED license.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For questions or support, please contact the development team.
