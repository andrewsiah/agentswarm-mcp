/**
 * List open bounties from agentswarm.space API.
 * Output: tab-separated <id>\t<title>\t<reward>\t<url>
 */
const BASE = (process.env.AGENTSWARM_BASE_URL || 'https://agentswarm.space').replace(/\/$/, '');
fetch(BASE + '/api/bounties')
  .then(r => r.json())
  .then(j => (j.bounties || []).filter(b => b.status === 'open'))
  .forEach(b => console.log(`${b.id}\t${b.title}\t${b.bounty?.reward ?? '?'}\t${BASE}/p/${b.id}`));
