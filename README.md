# 🚗 RideSync

**RideSync** is a full-stack campus ride-sharing platform that connects passengers with drivers, manages the complete ride lifecycle, and provides real-time ride updates through WebSockets.

The system is designed for a campus environment where users can request rides, drivers can accept and manage them, and both sides receive live updates about ride status and driver availability.

It also includes an **AI-powered assistant** to provide conversational assistance for ride-related queries.

---

## ✨ Features

### 👤 Authentication & Authorization

* User registration and login
* JWT-based authentication
* Password hashing using `bcrypt`
* Protected API routes
* Role-based access for:

  * Passengers
  * Drivers
* Persistent user profiles

### 🚕 Ride Management

* Request a ride with pickup and destination
* Schedule rides for later
* Driver acceptance of ride requests
* Ride lifecycle management:

  * `requested`
  * `accepted`
  * `inprogress`
  * `completed`
  * `cancelled`
* Fare and ride information
* Ride cancellation with cancellation reason
* Passenger feedback and ratings

### ⚡ Real-Time Updates

RideSync uses **Socket.IO** for real-time communication between the frontend and backend.

Users can receive events such as:

* Driver accepting a ride
* Ride starting
* Ride completing
* Ride cancellation
* Driver online/offline status changes

This reduces the need for repeatedly polling the server for ride-status changes.

### 🧑‍✈️ Driver Management

* Driver dashboard
* Online/offline status
* Vehicle information
* Driver ratings
* Driver ride management
* Driver availability for passengers

### 📊 Analytics

The application includes analytics functionality for monitoring ride-related information such as:

* Ride statistics
* Driver activity
* Earnings
* User activity
* Ride status distribution

### 🤖 AI Assistant

RideSync includes an AI-powered conversational assistant integrated into the application.

The assistant is designed to help users with ride-related questions and provide a more natural way of interacting with the platform.

The current implementation focuses on demonstrating AI-assisted user interaction. The architecture can be extended to provide the assistant with live application data such as active rides, historical ride analytics, and driver information.

> **Note:** Some analytics responses shown by the AI are currently demo/simulated data rather than real-time calculations directly from MongoDB.

---

# 🏗️ Architecture

```text
                    ┌──────────────────────┐
                    │      React App       │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                    REST API / Socket.IO
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │      Backend         │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication     Ride APIs       Driver APIs
        & Authorization       │                │
              │                └───────┬────────┘
              │                        │
              └────────────┬───────────┘
                           ▼
                    ┌───────────────┐
                    │    MongoDB    │
                    │   Database    │
                    └───────────────┘

                           ▲
                           │
                    ┌──────┴───────┐
                    │   Socket.IO  │
                    │ Real-time    │
                    │ Communication│
                    └──────────────┘

                    ┌────────────────┐
                    │  AI Assistant  │
                    │   AI Service   │
                    └────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* Axios
* Socket.IO Client
* React Router
* CSS

## Backend

* Node.js
* Express.js
* Socket.IO
* Mongoose
* JWT
* bcryptjs
* Express Validator
* Morgan

## Database

* MongoDB
* MongoDB Atlas

## AI

* AI-powered conversational assistant
* Backend API integration for AI requests

## Deployment

* **Frontend:** Vercel
* **Backend:** Render
* **Database:** MongoDB Atlas

---

# 📂 Project Structure

```text
ridesync/
│
├── backend/
│   ├── middleware/
│   │   └── auth.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Ride.js
│   │   └── Rating.js
│   │
│   ├── routes/
│   │   ├── auth.js
│   │   ├── rides.js
│   │   ├── drivers.js
│   │   ├── users.js
│   │   └── analytics.js
│   │
│   ├── socket/
│   │   └── socketHandler.js
│   │
│   └── server.js
│
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── App.jsx
        ├── Api.js
        ├── Authstore.js
        ├── Socket.js
        └── Usesocket.js
```

---

# 🔐 Authentication Flow

RideSync uses JWT-based authentication.

```text
User
 │
 │ Login / Register
 ▼
Express Auth API
 │
 ├── Validate request
 │
 ├── Check user
 │
 ├── Hash / compare password
 │
 └── Generate JWT
 │
 ▼
Frontend stores token
 │
 ▼
Authorization: Bearer <token>
 │
 ▼
Protected API
 │
 ▼
JWT Middleware
 │
 ├── Verify token
 ├── Find user
 └── Attach user to request
```

The authentication middleware also provides separate authorization checks for drivers and passengers.

---

# 🚦 Ride Lifecycle

A ride follows a defined state flow:

```text
requested
    │
    ▼
accepted
    │
    ▼
inprogress
    │
    ▼
completed
```

A ride can also be cancelled from an appropriate stage:

```text
requested ──────► cancelled
accepted  ──────► cancelled
inprogress ─────► cancelled
```

The `Ride` model stores the current status along with timestamps such as:

* `acceptedAt`
* `startedAt`
* `completedAt`
* `cancelledAt`

This makes the ride lifecycle easier to track and query.

---

# ⚡ Real-Time Communication

Socket.IO is used for events that need immediate updates.

For example:

```text
Passenger                 Backend                  Driver
    │                        │                        │
    │──── Request Ride ─────►│                        │
    │                        │──── Ride Request ─────►│
    │                        │                        │
    │                        │◄──── Accept Ride ──────│
    │◄──── ride:accepted ────│                        │
    │                        │                        │
    │◄──── ride:started ─────│                        │
    │                        │                        │
    │◄─── ride:completed ────│                        │
```

This allows the frontend to update the UI immediately when ride events occur.

---

# 🗄️ Database Design

RideSync uses MongoDB with Mongoose schemas.

### User

Stores:

* Name
* Email
* Password
* Role
* Phone
* Rating
* Total rides
* Total earnings
* Vehicle information
* Online status
* Location
* Socket ID

### Ride

Stores:

* Passenger
* Driver
* Pickup
* Destination
* Status
* Fare
* Distance
* Duration
* Scheduling information
* Ride timestamps
* Rating
* Feedback
* Cancellation information

### Rating

Stores:

* Ride
* Passenger
* Driver
* Stars
* Feedback

---

# 📈 Database Optimization

The Ride model uses compound indexes for frequently queried combinations.

```text
{ passenger: 1, status: 1 }
{ driver: 1, status: 1 }
{ status: 1, createdAt: -1 }
```

These indexes help improve queries such as:

* Finding a passenger's active rides
* Finding a driver's rides by status
* Retrieving recent rides by status

---

# 🤖 AI Assistant Architecture

The AI assistant provides a conversational interface inside the application.

A simplified flow is:

```text
User Message
     │
     ▼
React AI Assistant
     │
     ▼
Backend AI API
     │
     ▼
AI Model
     │
     ▼
Generated Response
     │
     ▼
Frontend Chat Interface
```

The assistant can be extended further by providing it with structured application context.

For example:

```text
User Query
    │
    ▼
Backend
    │
    ├── Active Ride Data
    ├── Driver Information
    ├── Ride Analytics
    └── User Context
    │
    ▼
AI Model
    │
    ▼
Context-Aware Response
```

The current project demonstrates the AI interaction layer, while deeper real-time data integration is a future enhancement.

---

# 🔒 Security

RideSync implements several basic security mechanisms:

* JWT authentication
* Password hashing with bcrypt
* Protected API routes
* Role-based authorization
* Request validation
* CORS configuration
* Password exclusion from normal user queries
* Environment variables for secrets and database configuration

Sensitive configuration such as:

```text
JWT_SECRET
MONGO_URI
CLIENT_URL
AI API keys
```

is kept outside the source code using environment variables.

---

# 🚀 Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/KhushiArya013/ridesync.git
cd ridesync
```

## 2. Backend

```bash
cd backend
npm install
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

## 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite development server, typically:

```text
http://localhost:5173
```

---

# 🔑 Environment Variables

### Backend

Create a `.env` file inside `backend`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:5173
PORT=5000
```

Add any required AI API key according to the AI assistant configuration.

### Frontend

Configure the required Vite environment variables according to the frontend API configuration.

---

# 🌐 Deployment

RideSync can be deployed as separate frontend and backend services.

```text
                 Internet
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
       Vercel                Render
      Frontend               Backend
          │                   │
          └─────────┬─────────┘
                    │
                    ▼
              MongoDB Atlas
```

---

# 📊 Scalability Considerations

The current project is a functional full-stack application rather than a production-scale Uber-like distributed system.

For significantly larger workloads, the architecture could be extended with:

### Horizontal Scaling

Run multiple Node.js backend instances behind a load balancer.

### Redis

Use Redis for:

* Caching
* Rate limiting
* Shared session/state where required
* Scaling Socket.IO across multiple backend instances

### Message Queues

For very high-volume background workloads such as telemetry processing, a message broker such as Kafka could decouple ingestion from processing.

### Database Scaling

MongoDB can be scaled using:

* Proper indexing
* Query optimization
* Connection pooling
* Replication
* Read scaling
* Sharding when the workload actually requires it

These are **future scalability improvements**, not dependencies required by the current implementation.

---

# ⚠️ Current Limitations

RideSync is primarily a project demonstrating full-stack development, real-time communication, authentication, database modeling, and AI integration.

Some production-grade capabilities that could be added in future versions include:

* Advanced driver-to-passenger geospatial matching
* Redis-based distributed state
* Kafka-based telemetry ingestion
* Advanced route optimization
* Real-time driver GPS tracking at large scale
* Payment gateway integration
* Push notifications
* Production-grade monitoring and observability
* Automated load testing
* Multi-instance Socket.IO scaling

---

# 🔮 Future Improvements

### Smart Driver Matching

Match passengers with nearby drivers using geographic distance, driver availability, estimated arrival time, and ride preferences.

### Real-Time Location Tracking

Allow passengers to track the driver's location during an active ride.

### Better AI Context

Provide the AI assistant with verified application data so it can answer questions about:

* Current ride status
* Driver information
* Ride history
* Actual ride analytics
* Estimated fare
* Cancellation policies

### Predictive Analytics

Use historical ride data to identify:

* Peak ride periods
* Popular pickup locations
* Driver demand
* Average ride duration
* Demand/supply imbalance

---

# 🎯 Engineering Highlights

RideSync demonstrates practical implementation of:

* Full-stack application architecture
* REST API design
* JWT authentication
* Role-based authorization
* MongoDB data modeling
* Database indexing
* Real-time WebSocket communication
* Event-driven UI updates
* AI API integration
* Error handling
* Environment-based configuration
* Frontend/backend separation
* Cloud deployment

---

# 👩‍💻 Author

**Khushi Arya**

B.Tech — Information Technology
Indian Institute of Information Technology, Lucknow

GitHub: `KhushiArya013`

---

## ⭐ Project Goal

RideSync was built to explore how a campus mobility platform can combine **full-stack web development, real-time communication, structured database design, and AI-assisted interaction** into a single application.

The project also serves as a foundation for exploring larger distributed-system concepts such as caching, asynchronous processing, horizontal scaling, geospatial matching, and event-driven architectures.
