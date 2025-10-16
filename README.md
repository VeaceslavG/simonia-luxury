# 🪑 Simonia Luxury

> **Simonia Luxury** – the place where you can find custom-made furniture designed to match your personal style.  
> This website allows users to explore a catalog of furniture, place orders, and connect directly with the manufacturer.

![React](<https://img.shields.io/badge/Frontend-React%20(Vite)-61dafb?logo=react>)
![Go](https://img.shields.io/badge/Backend-Go-00ADD8?logo=go)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?logo=postgresql)
![Bootstrap](https://img.shields.io/badge/UI-Bootstrap-7952B3?logo=bootstrap)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)
![License](https://img.shields.io/badge/License-Private-lightgrey)

---

## 🛠️ Technologies Used

### Frontend

- **React (Vite)**
- **HTML / SCSS / JavaScript**
- **Bootstrap** - responsive design and modern UI

### Backend

- **Go (Golang)** - REST API
- **PostgreSQL** - database
- **pgAdmin4** - database management
- **SMTP** - email services (validation, notifications)
- **Environment variables** - secure configuration

## 🚀 Installation and Local Setup

The project is structured into two main directories:

- `/client` → frontend (React)
- `/server` → backend (Go)

### Frontend Installation

```bash
cd client
npm install
npm run dev
```

### Backend Setup

Make sure you have Go and PostgreSQL installed.

```bash
cd server
go run main.go
```

> [!NOTE]
> Once deployed, the website will be accessible via a public link.

## 🔐 Environment Variables

Create a .env file inside the server directory with the following variables:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=shopdb
JWT_SECRET=your_jwt_secret
APP_PORT=8080
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URL=http://localhost:8080/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## ✨ Core Features

### User Authentication / Registration

- Email verification
- Google Login / Register integration

### Catalog de produse

- View products by category (sofas, corner sofas, armchairs, beds)

### Coș de cumpărături

- Stored in cookies for guest users
- Stored in database for logged-in users

### Comenzi

- Place and submit orders
- View order history in the user account

### E-mailuri automate

- Account verification
- Order confirmation

## 🗓️ Planuri viitoare

- Full Admin Panel
- Improved Product Page
- More interactivity and UI animations
- Client–Manufacturer communication system (chat or dynamic request form)

---

<div align="center">
  © 2025 **Veaceslav G.** — All rights reserved <br>
  📧 veaceslav.gorbuleac019@gmail.com
</div>
