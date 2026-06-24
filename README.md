# BYTEHEX TECH Internship

Welcome to my official internship repository for **ByteHex Tech**. This repository serves as a centralized hub containing all the full-stack applications, enterprise APIs, and technical solutions developed throughout my internship workspace.

## 📁 Repository Structure

The repository is organized by specific task folders, each containing isolated frontend and backend configurations:

- **`Task_1/` (Collaborative Workspace & Project Board)**
  - **Client:** A sleek, dark-themed React SPA using Tailwind CSS, featuring user authentication, multi-workspace creation, and project assignment dashboards.
  - **Server:** A Node.js and Express REST API integrated with an Aiven PostgreSQL cloud database connection instance.
- **`Task_2/` (Enterprise E-Commerce API)**
  - **Backend:** An enterprise-ready E-Commerce REST API featuring secure JWT token authorization, scalable product endpoints, and local multipart file uploading capabilities.
- **`Task_4/` (Advanced Production Feature)**
  - An optimized service block featuring containerized environment configurations and secure credential routing.

---

## 🛡️ Security & Environment Variables

To comply with GitHub's security policies and ensure secret protection, all sensitive keys, system passwords, and JWT handles are strictly stored locally within individual `.env` configuration scopes.

Every task folder containing a backend server requires its own local `.env` setup mapping:

### Task 1 Server Environment (`Task_1/server/.env`)

```env
AIVEN_PASSWORD=your_aiven_database_password
```
