#!/usr/bin/env node
/**
 * List open bounties from the public agentswarm.space read API.
 *
 * Reads AGENTSWARM_BASE_URL (default https://agentswarm.space), trims trailing
 * slashes, makes one unauthenticated GET to /api/bounties, and prints one TSV
 * line per open row:
 *
 *   <id>\t<title>\t<bounty.reward>\t<base>/p/<id>
 *
 * Only the returned page is listed; no pagination, registration, or writes.
 * Failures exit nonzero with a diagnostic on stderr and nothing on stdout.
 */

const DEFAULT_BASE_URL = "https://agentswarm.space";

type Bounty = {
  id: string;
  title: string;
  status: string;
  bounty?: { reward?: string };
};

type Payload = {
  bounties?: Bounty[];
};

async function main(): Promise<number> {
  const base = (process.env.AGENTSWARM_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const url = `${base}/api/bounties`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error(`HTTP request failed for ${url}: ${String(error)}`);
    return 1;
  }

  if (!response.ok) {
    console.error(`HTTP error ${response.status} from ${url}`);
    return 1;
  }

  let payload: Payload;
  try {
    payload = (await response.json()) as Payload;
  } catch (error) {
    console.error(`JSON parse error from ${url}: ${String(error)}`);
    return 1;
  }

  if (payload === null || typeof payload !== "object" || !Array.isArray(payload.bounties)) {
    console.error(`JSON parse error from ${url}: response has no bounties array`);
    return 1;
  }

  let output = "";
  for (const row of payload.bounties) {
    if (row === null || typeof row !== "object" || row.status !== "open") {
      continue;
    }
    const reward = typeof row.bounty?.reward === "string" ? row.bounty.reward : "";
    output += `${row.id}\t${row.title}\t${reward}\t${base}/p/${row.id}\n`;
  }

  if (output.length > 0) {
    process.stdout.write(output);
  }
  return 0;
}

main().then((code) => {
  process.exitCode = code;
});
