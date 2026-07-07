# ResQPlate

ResQPlate is a production-grade, location-based food rescue platform designed to bridge the gap between food donors (restaurants, events, individuals) and registered NGOs/volunteers. By leveraging real-time geospatial tracking, smart routing algorithms, and secure handoff protocols, ResQPlate ensures surplus food reaches those in need before it expires.

---

## Key Features

* **Role-Based Architecture:** Secure, distinct workflows for Donors, NGOs, and Admins.
* **Live Real-Time Navigation (WebSockets):** "Rapido-style" live GPS tracking using Socket.io and Leaflet Routing Machine. Donors can watch the volunteer's approach in real-time with dynamic ETA and distance calculations.
* **Secure OTP Verification:** A cryptographically generated 4-digit PIN guarantees secure physical handoffs. NGOs must physically arrive and submit the Donor's PIN to complete the rescue, preventing fraud and protecting the volunteer reliability scoring system.
* **In-App Chatbot Assistant:** An integrated conversational agent to provide instant support, answer FAQs, and guide new users through the donation and claiming processes.
* **Interactive Live Map:** Powered by React-Leaflet and OpenStreetMap. Features draggable search pins, custom search radii, and one-click reverse geocoding for pinpoint accurate pickup locations.
* **Smart Request & Approve Workflow:** NGOs request food claims, and Donors retain the power to approve or reject the pickup request, ensuring safety and control.
* **O(log N) Geospatial Queries:** Utilizes MongoDB's `2dsphere` indexes to instantly find available food within a user's exact proximity.
* **Algorithmic Volunteer Routing:** Uses a Modified Firefly Algorithm (mod-FA) to calculate and notify the most reliable and proximate volunteers when a new donation is posted.
* **Automated Data Integrity:** A background Node-Cron job automatically scans and flags expired donations every 5 minutes to keep the live map accurate.
* **Admin Control Center:** A comprehensive dashboard to monitor platform health, verify NGO accounts, and moderate global donations.

---

## Data Flow Diagram

```mermaid
flowchart TD
  %% External Entities
  Donor([Donor])
  NGO([NGO / Volunteer])
  Admin([Admin])

  %% Databases (Data Stores)
  DB_User[(Users DB)]
  DB_Donation[(Donations DB)]
  DB_Claim[(Claims DB)]

  %% Processes
  Auth(1.0 Auth & Verification)
  ManageDonation(2.0 Manage Donations)
  MatchClaim(3.0 Food Matching & Claims)
  Socket(4.0 Live Tracking & WebSockets)
  Dashboard(5.0 Admin Dashboard)

  %% Auth Flows
  Donor & NGO -->|Register/Login Data| Auth
  Auth <-->|Read/Write User| DB_User
  Admin -->|Verify NGO Accounts| Auth

  %% Donation Flows
  Donor -->|Post Food Details & GPS| ManageDonation
  ManageDonation <-->|Store/Update Status| DB_Donation

  %% Claim & Matching Flows
  NGO -->|Query Location/Radius| MatchClaim
  MatchClaim <-->|Fetch Available Food| DB_Donation
  NGO -->|Request to Claim Food| MatchClaim
  MatchClaim -->|Create Pending Claim| DB_Claim
  MatchClaim -->|Notify Incoming Request| Donor
  
  %% OTP & Handoff
  Donor -->|Approve Claim & Generate OTP| MatchClaim
  MatchClaim -->|Show 4-Digit PIN| Donor
  
  %% Real-Time Tracking
  MatchClaim -->|Open Secure Room| Socket
  NGO -->|Broadcast Live GPS| Socket
  Socket -->|Push Live Map Updates & ETA| Donor
  
  %% Completion
  NGO -->|Submit Donor's OTP at Pickup| MatchClaim
  MatchClaim <-->|Verify OTP & Update Reliability Score| DB_User & DB_Claim

  %% Admin Flows
  Admin -->|Request Platform Stats| Dashboard
  Dashboard -->|Read Metrics| DB_User & DB_Donation & DB_Claim

```

## Tech Stack

### Frontend (Client)

* **Framework:** React.js (Vite)
* **Styling:** Tailwind CSS
* **Mapping:** React-Leaflet, Leaflet.js
* **Routing Engine:** Leaflet Routing Machine (OSRM)
* **Real-Time Engine:** Socket.io-client
* **Geocoding:** Nominatim (OpenStreetMap API)
* **Routing:** React Router v6
* **HTTP Client:** Axios (configured with cross-origin credentials)

### Backend (Server)

* **Environment:** Node.js, Express.js, HTTP Server
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Real-Time Engine:** Socket.io
* **Authentication:** JSON Web Tokens (JWT), bcrypt.js
* **Task Scheduling:** node-cron
* **Validation:** express-validator

---

## Environment Variables

To run this project locally or in production, you will need to add the following environment variables.

### Backend (`/backend/.env`)

| Variable       | Description                    | Example                   |
| -------------- | ------------------------------ | ------------------------- |
| `PORT`       | The port your backend runs on  | `8080`                  |
| `MONGO_URI`  | Your MongoDB connection string | `mongodb+srv://...`     |
| `JWT_SECRET` | Secret key for signing tokens  | `your_super_secret_key` |
| `JWT_EXPIRE` | Token expiration time          | `7d`                    |
| `CLIENT_URL` | The URL of your frontend       | `http://localhost:5173` |

### Frontend (`/frontend/.env`)

| Variable             | Description                 | Example                       |
| -------------------- | --------------------------- | ----------------------------- |
| `VITE_BACKEND_URL` | The URL of your backend API | `http://localhost:8080/api` |

---

## Local Installation & Setup

**1. Clone the repository**

```bash
git clone https://github.com/manish01101/ResQPlate.git
```

**2. Go inside the repository**

```bash
cd ResQPlate/
```

**3. Setup the Backend**

```bash
cd backend
npm install
# Create your .env file here
npm run dev # npm run start
```

**4. Setup the Frontend**

```bash
cd ../frontend
npm install
# Create your .env file here
npm run dev
```
