# MediCare Sync — Full-Stack Hospital Management System

An enterprise-grade **MERN (MongoDB, Express.js, React, Node.js)** Hospital Management & Patient Portal featuring **Role-Based Access Control (RBAC)**, real-time slot locking, downloadable PDF prescriptions, department-wise Recharts analytics, and system audit logs.

---

## Core Features

### 1. Authentication & Security
- **3-Tier RBAC:** Dedicated protected routes and portals for **Patients**, **Doctors**, and **Admins**.
- **JWT & Bcrypt:** Stateless token authentication with password hashing and rate-limited auth endpoints.
- **Forgot & Reset Password:** SHA-256 hashed reset tokens with 15-minute expiration and email notifications.

### 2. Patient Portal
- **Profile Management:** Update personal & medical metadata (Age, Gender, Blood Group, Phone, Address).
- **Doctor Discovery & Real-Time Slot Booking:** Filter specialists, sort by fee/experience, and book conflict-free slots protected by compound MongoDB indexes.
- **Downloadable PDF Prescriptions:** Generate and download formatted electronic prescriptions using `jsPDF`.
- **Medical Report Vault:** Upload (PDF/JPG/PNG via Multer), view, and delete diagnostic lab reports.

### 3. Doctor Portal
- **Availability & Fee Manager:** Configure specialization, consultation fees, active working days, and appointment time slots.
- **Patient Medical History Viewer:** Inspect patient demographics, past consultations, and uploaded lab reports before prescribing.
- **Digital Prescription & Queue Management:** Accept/reject appointments, prescribe medicines, and mark visits completed.

### 4. Admin Control Center
- **Department-Wise Analytics (Recharts):** Interactive Bar and Pie charts tracking appointments and revenue per medical department.
- **Hospital Governance:** Approve/revoke doctors, manage hospital departments, oversee patients and appointments, and audit live system **Activity Logs**.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Axios, Recharts, jsPDF, Lucide Icons |
| **Backend** | Node.js, Express.js, JWT, Bcryptjs, Multer, Nodemailer, Express Validator, Helmet |
| **Database** | MongoDB, Mongoose ODM (Compound Unique Indexes & Aggregation Pipelines) |

---

## Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Patient** | `patient@demo.com` | `Password123` |
| **Doctor** | `doctor@demo.com` | `Password123` |
| **Admin** | `admin@demo.com` | `Password123` |