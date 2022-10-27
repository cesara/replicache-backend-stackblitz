const port = 3010;
import { ReplicacheExpressServer } from "replicache-express";
import express from 'express';
import path from 'path';
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
r.app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});
r.app.use(express.static('static'));
r.start(() => {
  console.log(
    `Replicache is listening on ${options.host}:${options.port}`,
  );
});