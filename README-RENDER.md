# Introspens/arte - Render Deployment Guide

## Overview
Complete artistic community platform restructured for Render deployment with static HTML frontend and Express.js backend.

## Project Structure
```
/
├── public/                 # Static HTML files served by Express
│   ├── index.html         # Landing page
│   ├── registro.html      # User registration
│   ├── login.html         # User login
│   ├── portal.html        # Main dashboard
│   ├── perfil.html        # User profile
│   ├── subir-actividad.html # Activity upload
│   ├── actividades.html   # Community activities
│   ├── ranking-trazos.html # Traces ranking
│   ├── ranking-palabras.html # Words ranking
│   ├── noticias.html      # News section
│   ├── avisos.html        # Announcements
│   ├── notificaciones.html # User notifications
│   ├── admin.html         # Admin panel
│   └── usuario.html       # User profiles
├── server.js              # Production Express server
├── init-db.sql           # Database schema
├── package-production.json # Production dependencies
└── README-RENDER.md      # This file
```

## Features
- **User Management**: Signature-based authentication with automatic admin assignment (#INELUDIBLE)
- **Activity System**: Upload creative works with automatic trace calculation
- **Community Features**: News, announcements, rankings, notifications
- **Admin Panel**: Content management and user administration
- **Responsive Design**: Dark elegant theme with lavender accents

## Database Setup
1. Create PostgreSQL database on Render
2. Run the database initialization script:
```sql
-- Copy contents from init-db.sql
```

## Environment Variables
Set these in Render:
- `DATABASE_URL`: PostgreSQL connection string
- `NODE_ENV`: production
- `PORT`: (automatically set by Render)

## Deployment Steps

### 1. Database Setup
1. Create PostgreSQL database on Render
2. Copy the SQL from `init-db.sql` and run it in your database console

### 2. Web Service Setup
1. Create new Web Service on Render
2. Connect your repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables

### 3. Configuration
1. Upload `package-production.json` as `package.json` for production
2. Ensure `server.js` is in the root directory
3. Verify all static files are in `/public` folder

## API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/activities` - Activities management
- `GET /api/rankings/traces` - Traces ranking
- `GET /api/rankings/words` - Words ranking
- `GET/POST /api/news` - News management
- `GET/POST /api/announcements` - Announcements
- `GET /api/notifications/:userId` - User notifications
- `GET/PATCH /api/users` - User management

## Trace Calculation System
- **Narrativa**: 10 traces per 100 words
- **Microcuento**: 8 traces per 50 words
- **Drabble**: 15 traces (exactly 100 words)
- **Hilo**: 5 traces per 280 words
- **Rol**: 3 traces per 50 words
- **Otro**: 5 traces per 100 words
- **Bonus**: +2 traces per response received

## Aristas (Creative Dimensions)
1. Introspección - Inner world exploration
2. Nostalgia - Memories and melancholy
3. Amor - All forms of love
4. Fantasía - Imaginary worlds
5. Misterio - Mystery and suspense
6. Actividades Express - Quick writing exercises

## Design System
- **Colors**: Black/dark gray background, lavender (#cbbcff), white, gold (#e0c074)
- **Typography**: Playfair Display serif font
- **Style**: Clean, minimalist with blur effects
- **Theme**: Dark elegant with purple accents

## Admin Features
- Automatic admin role for signature "#INELUDIBLE"
- Content publishing (news, announcements)
- User management (roles, traces, ranks, medals)
- System notifications to all users

## Production Checklist
- [ ] Database created and initialized
- [ ] Environment variables set
- [ ] Static files in /public folder
- [ ] server.js configured for Express static serving
- [ ] PostgreSQL connection tested
- [ ] All API endpoints functional
- [ ] Admin panel accessible
- [ ] Responsive design verified

## Support
For deployment issues, verify:
1. Database connection string is correct
2. All static files are served from /public
3. API routes are responding correctly
4. Database tables are created properly