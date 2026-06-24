# Task 4 — Multi-Workspace & Role Management Dashboard

## 📝 Project Overview

Task 4 introduces a dynamic, premium-styled **Workspace Management Dashboard** designed to organize projects, teams, and collaborative environments. It features an intuitive layout allowing users to create custom workspaces with tailored descriptions and instantly assigns tracking scopes such as explicit ownership badges.

---

## ✨ Key Features

- **User Session Greeting:** Displays active logged-in user credentials and customized profiles directly on the control banner.
- **Workspace Creation Engine:** An interactive creation form with inline configuration fields for Workspace Names and target Focus Descriptions.
- **Dynamic Environment Cards:** Responsive card grids showcasing active workspaces with dedicated focus text summaries.
- **Granular Access Control:** Integrated metadata visualization including micro-badges such as `ROLE: OWNER` to identify team privileges at a glance.
- **Sleek Light-Mode UI:** Built using a modern, clean design aesthetic featuring soft borders, high contrast action triggers, and scannable tracking states.

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React.js, Tailwind CSS (for modern UI styling), Lucide React (for interface icons).
- **Backend:** Node.js & Express REST API wrapper.
- **Database Layer:** Linked securely to the centralized Aiven PostgreSQL instance via environment injection.

---

## ⚙️ Configuration & Secrets

To maintain strict compliance with security standards and prevent accidental data exposures, infrastructure credentials must be loaded via local environment properties.

### Local Environment Mapping (`Task_4/.env`)

Create a `.env` file in your execution scope and provide the following definitions:

```env
# Infrastructure Runtime Configurations
PORT=5004
DATABASE_URL=your_aiven_postgresql_connection_string
AIVEN_PASSWORD=AVNS_FDFeXOy9pNfF3xZ4zpc
```
