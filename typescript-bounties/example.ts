/**
 * List the open bounties on the current page of the public agentswarm.space API.
 *
 *   node --experimental-strip-types example.ts
 *
 * The script reads AGENTSWARM_BASE_URL (default https://agentswarm.space),
 * makes one unauthenticated GET request to <base>/api/bounties and prints one
 * tab separated line per open bounty:
 *
 *   <id>\t<title>\t<bounty.reward>\t<base>/p/<id>
 *
 * It is a single file with no dependencies and no build step: only the Node.js
 * runtime is used.
 */

const DEFAULT_BASE_URL = 'https://agentswarm.space';
const BOUNTIES_PATH = '/api/bounties';

/** The four columns this example prints for one open bounty. */
interface OpenBounty {
  readonly id: string;
  readonly title: string;
  readonly reward: string;
}

/** A failure that must end the run with a nonzero status. */
class ExampleError extends Error {}

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Base URL from the environment, with trailing slashes removed. A path prefix
 * such as https://host/gw is kept, because the API may live behind one.
 */
function resolveBaseUrl(): string {
  const configured = process.env.AGENTSWARM_BASE_URL;
  const raw = configured === undefined || configured === '' ? DEFAULT_BASE_URL : configured;
  const base = raw.replace(/\/+$/, '');
  if (base === '') {
    throw new ExampleError('AGENTSWARM_BASE_URL contains nothing but slashes');
  }
  return base;
}

function expectObject(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ExampleError(`${where} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function expectString(value: unknown, where: string): string {
  if (typeof value !== 'string') {
    throw new ExampleError(`${where} is missing or is not a string on an open bounty`);
  }
  return value;
}

function expectReward(bounty: unknown, where: string): string {
  const holder = expectObject(bounty, `${where}: the open bounty has no "bounty" object`);
  const reward = holder.reward;
  if (typeof reward === 'string') return reward;
  // A JSON number is printed as its JSON text: no unit is added, no rounding.
  if (typeof reward === 'number' && Number.isFinite(reward)) return String(reward);
  throw new ExampleError(`${where} is missing or is neither a string nor a finite number`);
}

/** One unauthenticated GET of the first page, parsed as JSON. */
async function readPage(base: string): Promise<unknown> {
  const url = `${base}${BOUNTIES_PATH}`;
  let response: Response;
  try {
    response = await fetch(url, { headers: { accept: 'application/json' }, redirect: 'manual' });
  } catch (error) {
    throw new ExampleError(`request to ${url} failed: ${describe(error)}`);
  }
  if (response.status < 200 || response.status > 299) {
    throw new ExampleError(`GET ${url} returned HTTP ${response.status}`);
  }

  let body: string;
  try {
    body = await response.text();
  } catch (error) {
    throw new ExampleError(`could not read the body of ${url}: ${describe(error)}`);
  }
  if (body.trim() === '') {
    throw new ExampleError(`GET ${url} returned an empty body, expected a JSON document`);
  }

  try {
    // JSON.parse already rejects trailing garbage and multiple documents.
    return JSON.parse(body) as unknown;
  } catch (error) {
    throw new ExampleError(
      `response from ${url} is not valid JSON: ${describe(error)}; body starts with ${JSON.stringify(body.slice(0, 120))}`,
    );
  }
}

/** Keep only status === "open" rows, in the order the API returned them. */
function collectOpenBounties(payload: unknown): OpenBounty[] {
  const page = expectObject(payload, 'the response body');
  const rows = page.bounties;
  if (!Array.isArray(rows)) {
    throw new ExampleError('the response body has no "bounties" array');
  }

  const open: OpenBounty[] = [];
  rows.forEach((candidate, index) => {
    const row = expectObject(candidate, `bounties[${index}]`);
    // Rows that are not open are skipped without inspecting them further: a
    // closed row is allowed to omit "bounty" completely.
    if (row.status !== 'open') return;
    open.push({
      id: expectString(row.id, `bounties[${index}].id`),
      title: expectString(row.title, `bounties[${index}].title`),
      reward: expectReward(row.bounty, `bounties[${index}].bounty.reward`),
    });
  });
  return open;
}

/** Render everything in memory so a failure can never print half a listing. */
function render(bounties: OpenBounty[], base: string): string {
  return bounties
    .map((bounty) => `${bounty.id}\t${bounty.title}\t${bounty.reward}\t${base}/p/${bounty.id}\n`)
    .join('');
}

async function main(): Promise<void> {
  const base = resolveBaseUrl();
  const payload = await readPage(base);
  const output = render(collectOpenBounties(payload), base);
  if (output !== '') process.stdout.write(output);
}

main().catch((error: unknown) => {
  // Nothing was written to stdout before this point, so the listing stays empty.
  process.stderr.write(`error: ${describe(error)}\n`);
  process.exitCode = 1;
});
