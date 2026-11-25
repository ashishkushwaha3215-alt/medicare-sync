# MediCare Sync 

**A Full-Stack Healthcare Management System**

MediCare Sync is a MERN stack-based healthcare management platform designed to simplify hospital operations and improve coordination between patients, doctors, and administrators.

🌐 **Live Website:** https://medicare-sync-eta.vercel.app/

🔗 **Backend API:** https://medicare-sync-api.onrender.com/api/v1/health

## ✨ Features

- User Authentication and Authorization
- Role-Based Access (Admin, Doctor, Patient)
- Doctor Management
- Patient Management
- Appointment Booking and Management
- Department Management
- Dashboard and Analytics
- Reports Management
- Responsive User Interface
- RESTful API Integration

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- Tailwind CSS

**Backend**
- Node.js
- Express.js
- REST API
- JWT Authentication

**Database**
- MongoDB
- Mongoose

**Deployment**
- Vercel – Frontend
- Render – Backend
- MongoDB Atlas – Database

## ## Project Structure

```text
medicare-sync/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── appointment.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── doctor.controller.js
│   │   │   ├── notificationController.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   ├── upload.middleware.js
│   │   │   └── validate.middleware.js
│   │   │
│   │   ├── models/
│   │   │   ├── ActivityLog.js
│   │   │   ├── Appointment.js
│   │   │   ├── Department.js
│   │   │   ├── DoctorProfile.js
│   │   │   ├── MedicalReport.js
│   │   │   ├── Notification.js
│   │   │   └── User.js
│   │   │
│   │   ├── routes/
│   │   │   ├── adminRoutes.js
│   │   │   ├── appointment.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── doctor.routes.js
│   │   │   ├── index.js
│   │   │   ├── notification.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── utils/
│   │   │   ├── ApiError.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── createNotification.js
│   │   │   ├── generateToken.js
│   │   │   ├── logActivity.js
│   │   │   └── sendEmail.js
│   │   │
│   │   ├── validators/
│   │   │   └── auth.validator.js
│   │   │
│   │   └── app.js
│   │
│   └── server.js
│
├── frontend/
│   └── src/
│       ├── api/
│       │   └── axios.js
│       ├── components/
│       │   ├── Navbar.jsx
│       │   └── ProtectedRoute.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
│       │   ├── AdminPanel.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Doctors.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── Home.jsx
│       │   ├── Login.jsx
│       │   ├── NotificationCenter.jsx
│       │   ├── Profile.jsx
│       │   ├── Register.jsx
│       │   ├── Reports.jsx
│       │   └── ResetPassword.jsx
│       ├── utils/
│       │   └── generatePrescriptionPdf.js
│       ├── App.jsx
│       ├── App.css
│       ├── index.css
│       └── main.jsx
│
└── README.md
```

## 🚀 Live Deployment

Frontend: https://medicare-sync-eta.vercel.app/

Backend Health Check: https://medicare-sync-api.onrender.com/api/v1/health

## 🔒 Security

- Environment variables for sensitive configuration
- Password hashing
- JWT-based authentication
- Role-based access control

**Note:** This project is intended for educational and demonstration purposes. Do not use real patient information in the public demo.

## 👨‍💻 Author

**Ashish Kushwaha**

B.Tech – Computer Science and Engineering

---

⭐ If you find this project interesting, feel free to explore the repository!
