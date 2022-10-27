import {
  Replicache,
  TEST_LICENSE_KEY,
} from "https://unpkg.com/replicache@11.2.0/out/replicache.mjs";

function log(msg) {
  document.querySelector("#log").value += msg + "\n";
}

const rep = new Replicache({
  name: "New Replicache",
  licenseKey: TEST_LICENSE_KEY,
  mutators: {
    increment: async (tx, delta) => {
      const prev = (await tx.get("count")) ?? 0;
      const next = prev + delta;
      await tx.put("count", next);
    },
  },
});

rep.subscribe(async (tx) => (await tx.get("count")) ?? 0, {
  onData: (count) => log(`count changed: ${count}`),
});

document.querySelector("#increment").onclick = () => {
  rep.mutate.increment(1);
  log("incremented");
};

async function helloReplicache() {
  log(`Hello from Replicache client: ${await rep.clientID}`);
}

helloReplicache();
