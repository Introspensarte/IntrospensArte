
// Main entry point - delegates to the TypeScript server
import('./server/index.ts').catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
