# Full-Stack Learning Management System (LMS) Dashboard

A comprehensive client-server LMS dashboard built for the BYTEHEX TECH Internship (Task 1). This project demonstrates a decoupled architecture, separating the front-end user interface from the back-end data API.

## 🚀 Features

- **Client-Server Architecture:** Fully separated frontend and backend environments communicating via RESTful API endpoints.
- **Interactive Dashboard:** A centralized hub for tracking courses, student progress, and key educational metrics.
- **Data Management:** Backend server configured to handle incoming requests, process data, and serve it seamlessly to the client.
- **Responsive UI:** A modern, accessible frontend designed to provide a smooth user experience across different screen sizes.

## 🛠️ Tech Stack

- **Frontend (Client):** React / JavaScript, CSS/Tailwind (Update if you used standard HTML/CSS)
- **Backend (Server):** Node.js, Express.js
- **Architecture:** RESTful API

## ⚙️ How to Run Locally

This project requires running two separate terminals—one for the server and one for the client.

### 1. Setup the Backend (Server)

1. Open a terminal and navigate to the server folder:
   `cd server` (or your specific backend folder name)
2. Install dependencies:
   `npm install`
3. Start the server:
   `npm start` (or `node server.js`)
   _The server should now be running on its designated port (e.g., localhost:5000)._

### 2. Setup the Frontend (Client)

1. Open a **new** terminal and navigate to the client folder:
   `cd client` (or your specific frontend folder name)
2. Install dependencies:
   `npm install`
3. Start the client:
   `npm run dev` (or `npm start`)
   _The LMS Dashboard will open in your browser._
