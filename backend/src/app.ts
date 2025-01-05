import express, { Application, Request, Response } from 'express';
// import routes from './routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
// app.use('/api', routes);

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.send('Welcome to the TypeScript Node.js App!');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
