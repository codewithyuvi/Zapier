import express from 'express';
import type { Request, Response } from 'express';
const app = express();
const PORT = 3002;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hooks service is running with TypeScript!" });
});

app.listen(PORT, () => {
  console.log(`Hooks service listening on http://localhost:${PORT}`);
});