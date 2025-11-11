# Gaming Room Reservation API

## Setup (Lokal)

1. Clone repo
   ```bash
   git clone <repo-url>
   cd gaming-room-backend
   ```
2. Install dependencies
   npm install

3. Copy environment
   cp .env.example .env

   # Edit .env dengan kredensial Anda

4. Lint dan jalankan server
   npm run lint # pastikan tanpa error
   npm start # server di http://localhost:3000

## Base URL

http://localhost:3000

## Endpoint Utama

### Auth

- POST /auth/register
- POST /auth/login

### Rooms

- GET /rooms
- POST /rooms (admin)
- PUT /rooms/:id (admin)
- DELETE /rooms/:id (admin)
- POST /rooms/booking

### Reservations

- GET /rooms/reservations
- POST /rooms/reservations
- DELETE /rooms/reservations/:id
