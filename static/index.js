import {
  Replicache,
  TEST_LICENSE_KEY,
} from 'https://unpkg.com/replicache@11.2.0/out/replicache.mjs';

function log(msg) {
  const textarea = document.querySelector('#log');
  textarea.scrollTop = textarea.scrollHeight;
  textarea.value += msg + '\n';
}


const rep = new Replicache({
  name: 'New Replicache',
  licenseKey: TEST_LICENSE_KEY,
  pushURL: `/api/push`,
  pullURL: `/api/pull`,
  mutators: {
    increment: async (tx, delta) => {
      const prev = (await tx.get('count')) ?? 0;
      const next = prev + delta;
      await tx.put('count', next);
    },
  },
});

// Implements a Replicache poke using Server-Sent Events.
// If a "poke" message is received, it will pull from the server.
const ev = new EventSource(`/api/poke`, {
  withCredentials: true,
});
ev.onmessage = async (event) => {
  if (event.data === 'poke') {
    await rep.pull();
  }
};

rep.subscribe(async (tx) => (await tx.get('count')) ?? 0, {
  onData: (count) => log(`count changed: ${count}`),
});

document.querySelector('#increment').onclick = () => {
  rep.mutate.increment(1);
  log('incremented');
};

log(`Hello from Replicache client: ${await rep.clientID}`);
