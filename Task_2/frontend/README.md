# Enterprise Cloud E-Commerce Dashboard

A full-stack, cloud-backed inventory management and storefront application built for the BYTEHEX TECH Internship.

## 🚀 Features

- **Role-Based Access Control:** Distinct views and privileges for `Admin` (Inventory Management) and `Customer` (Storefront).
- **Live Cloud Database:** Powered by Aiven PostgreSQL for reliable, real-time data persistence.
- **Advanced Image Handling:** Supports both direct local file uploads (via Multer) and external web URLs for product imagery.
- **Admin Analytics:** Automated calculation of Total SKUs, Stock Volume, Asset Valuation, and Low-Stock warnings.
- **Interactive Cart:** Client-side shopping basket with real-time subtotal calculations and stock limit validation.
- **Modern UI/UX:** Responsive, sleek design utilizing Tailwind CSS and React Hot Toast for instant user feedback.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS
- **Backend:** Node.js, Express.js, Multer (Multipart/Form-Data), CORS
- **Database:** PostgreSQL (Aiven Cloud)

## ⚙️ How to Run Locally

1. **Clone the repository.**
2. **Setup Backend:**
   - `cd backend`
   - `npm install`
   - Create a `.env` file and add your Aiven Database URI: `DATABASE_URL=your_aiven_url_here`
   - `node server.js`
     _(Note: The server will automatically generate an `uploads` directory to store physical image files)._
3. **Setup Frontend:**
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Access the application at `http://localhost:5173`.
