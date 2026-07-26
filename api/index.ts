// Vercel serverless function — wraps the shared Express app.
// All /api/* requests are routed here via vercel.json rewrites.
import app from "../artifacts/api-server/src/app";

export default app;
