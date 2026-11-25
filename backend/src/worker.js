import { httpServerHandler } from 'cloudflare:node';
import app from './app.js';
import { setWorkerEnvironment } from './config/runtime.js';

const port = 8787;
app.listen(port);
const handler = httpServerHandler({ port });

export default {
  fetch(request, env, ctx) {
    setWorkerEnvironment(env);
    return handler.fetch(request, env, ctx);
  }
};
