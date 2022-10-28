const port = 3010;
import { ReplicacheExpressServer } from 'replicache-express';
import express from 'express';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
const mutators = {
  increment: async (tx, delta) => {
    const prev = (await tx.get('count')) ?? 0;
    const next = prev + delta;
    await tx.put('count', next);
  },
};

const options = {
  mutators,
  port,
  host: process.env.HOST || '0.0.0.0',
};
let resolveSpaceID;
let spaceID = new Promise((resolve) => {
  resolveSpaceID = resolve;
});
const r = new ReplicacheExpressServer(options);
r.app.use(['/api/push', '/api/pull', '/api/poke'], async (req, res) => {
  req.url = req.baseUrl.replace('/api/', '/api/replicache/');
  req.query.spaceID = await spaceID;
  r.app.handle(req, res);
});
r.app.use(express.static('static'));
r.app.use('*', (_req, res) => {
  const index = path.join('pages', 'index.html');
  const html = fs.readFileSync(index, 'utf8');
  res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
});
r.start(async () => {
  console.log(`Replicache is listening on ${options.host}:${options.port}`);
  const resp = await fetch(
    `http://${options.host}:${options.port}/api/replicache/createSpace`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
  const respJSON = await resp.json();
  console.log('createdSpace', respJSON);
  resolveSpaceID(respJSON.spaceID);
});
