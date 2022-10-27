import {
  Replicache,
  TEST_LICENSE_KEY,
} from "https://unpkg.com/replicache@11.2.0/out/replicache.mjs";

async function main() {
  const { pathname } = window.location;

  if (pathname === "/" || pathname === "") {
    window.location.href = "/space/" + (await createSpace());
    return;
  }

  // URL layout is "/space/<spaceid>"
  const paths = pathname.split("/");
  const [, spaceDir, spaceID] = paths;
  if (
    spaceDir !== "space" ||
    spaceID === undefined ||
    !(await spaceExists(spaceID))
  ) {
    window.location.href = "/";
    return;
  }

  function log(msg) {
    document.querySelector("#log").value += msg + "\n";
  }

  const rep = new Replicache({
    name: "New Replicache",
    licenseKey: TEST_LICENSE_KEY,
    pushURL: `/api/replicache/push?spaceID=${spaceID}`,
    pullURL: `/api/replicache/pull?spaceID=${spaceID}`,
    mutators: {
      increment: async (tx, delta) => {
        const prev = (await tx.get("count")) ?? 0;
        const next = prev + delta;
        await tx.put("count", next);
      },
    },
  });

  // Implements a Replicache poke using Server-Sent Events.
  // If a "poke" message is received, it will pull from the server.
  const ev = new EventSource(`/api/replicache/poke?spaceID=${spaceID}`, {
    withCredentials: true,
  });
  ev.onmessage = async (event) => {
    if (event.data === "poke") {
      await rep.pull();
    }
  };

  rep.subscribe(async (tx) => (await tx.get("count")) ?? 0, {
    onData: (count) => log(`count changed: ${count}`),
  });

  document.querySelector("#increment").onclick = () => {
    rep.mutate.increment(1);
    log("incremented");
  };


  async function spaceExists(spaceID) {
    return await fetchJSON("spaceExists", spaceID);
  }

  async function createSpace(spaceID) {
    const createSpaceRes = await fetchJSON("createSpace", spaceID);
    if (createSpaceRes) {
      return createSpaceRes.spaceID;
    }
  }

  async function fetchJSON(apiName, spaceID) {
    const res = await fetch(`/api/replicache/${apiName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body:
        spaceID &&
        JSON.stringify({
          spaceID,
        }),
    });
    return await res.json();
  }

  log(`Hello from Replicache client: ${await rep.clientID}`);
}
await main();