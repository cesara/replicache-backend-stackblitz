const port = 3010;
import { ReplicacheExpressServer } from "replicache-express";
import express from 'express';
import path from 'path';
import fs from 'fs';
const mutators = {
  increment: async (tx, delta) => {
    const prev = (await tx.get('count')) ?? 0;
    const next = prev + delta;
    await tx.put('count', next);
  },
}

const options = {
  mutators,
  port,
  host: process.env.HOST || '0.0.0.0',
};

const r = new ReplicacheExpressServer(options);
r.app.use(express.static('static'));
r.app.use('*', (_req, res) => {
  const index = path.join("pages", 'index.html');
  const html = fs.readFileSync(index, 'utf8');
  res.status(200).set({'Content-Type': 'text/html'}).end(html);
});
r.start(() => {
  console.log(
    `Replicache is listening on ${options.host}:${options.port}`,
  );
});