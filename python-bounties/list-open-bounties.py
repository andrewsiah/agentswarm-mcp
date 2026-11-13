"""List open bounties from agentswarm.space API."""
import os, json, urllib.request
base = os.environ.get('AGENTSWARM_BASE_URL', 'https://agentswarm.space').rstrip('/')
r = urllib.request.urlopen(f'{base}/api/bounties').read().decode()
data = json.loads(r)
for b in data.get('bounties', []):
    if b['status'] == 'open':
        reward = b.get('bounty', {}).get('reward', '?')
        print(f"{b['id']}\t{b['title']}\t{reward}\t{base}/p/{b['id']}")
