
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log('Starting server...');

// Check if we're in production or development
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'production' : 'development'}`);

if (isProduction) {
  // In production, serve built files from dist/public
  const distPath = path.join(__dirname, 'dist', 'public');
  console.log(`Checking for dist path: ${distPath}`);
  
  if (fs.existsSync(distPath)) {
    console.log('Serving from dist/public');
    app.use(express.static(distPath));
    
    // Handle SPA routing - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(distPath, 'index.html'));
      }
    });
  } else {
    // Fallback to public folder if dist doesn't exist
    console.log('Dist not found, serving from public folder');
    app.use(express.static(path.join(__dirname, 'public')));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });
  }
} else {
  // In development, serve from public folder as fallback
  console.log('Development mode - serving from public folder');
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Basic route for development
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
