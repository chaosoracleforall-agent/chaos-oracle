# Shutdown Runbook — Copy-Paste Commands & Direct Links

Do these in order. Each section is one sitting.

---

## 1. STOP THE AGENT (SSH session — ~2 min)

```bash
ssh -i ~/.ssh/google_compute_engine davidgarcia@34.59.225.218 << 'REMOTE'
cd ~/agent-node
echo '{"active":false}' > agent_status.json
pm2 stop chaos-agent 2>/dev/null; pm2 delete chaos-agent 2>/dev/null; pm2 save
sudo docker stop $(sudo docker ps -q) 2>/dev/null
sudo docker rm $(sudo docker ps -aq) 2>/dev/null
echo "--- Verification ---"
pm2 list
sudo docker ps
ps aux | grep -E 'ts-node|node.*index' | grep -v grep
echo "--- Agent stopped ---"
REMOTE
```

---

## 2. CHECK BALANCES & BACK UP KEYS

Check each wallet on BaseScan (click links):

- [Agent wallet](https://basescan.org/address/0x46B268e9C57083F9c6aDd793995214E1503B7275)
- [Creator wallet](https://basescan.org/address/0x398bA4b1b82be8FdACdAbeB163584C7376b023B8)
- [V3 Deployer wallet](https://basescan.org/address/0xaeC929C8C73e92C90AcD4c94cF76b158914362E1)
- [V3 Contract](https://basescan.org/address/0x76b714816689eC9f92F139900a04906ba0FBd34b)
- [V2 Contract](https://basescan.org/address/0x1b60e2C970Fe6e64c6e067130FF4Ae8a713E93b6)
- [V1 Contract](https://basescan.org/address/0x591A48064c1DB035B1562d60ed27cE18B48Bd228)

Back up the agent private key from GCP before deleting secrets:

```bash
gcloud secrets versions access latest --secret=agent-private-key --project=project-93ba0cb5-fff8-4cf3-a12
```

Save that output to a secure offline location (password manager, hardware wallet, encrypted file).

---

## 3. DRAIN WALLETS & PAUSE CONTRACT

Transfer ETH + CHAOS tokens from all 3 wallets to your personal wallet using your preferred wallet software (MetaMask, Rabby, cast CLI, etc.).

Then pause V3 — go to the write contract page and call `togglePause()` with the V3 Deployer wallet:
- [V3 Write Contract](https://basescan.org/address/0x76b714816689eC9f92F139900a04906ba0FBd34b#writeContract) → function #22 `togglePause`

Check Aerodrome LP position (if any):
- [Aerodrome Pool](https://aerodrome.finance/pools/0x8C774Fed3A01Fe0f10412E78532db77D42c14652)

---

## 4. POST SHUTDOWN ANNOUNCEMENTS

Copy from `SHUTDOWN_ANNOUNCEMENT.md` in this repo. Post on:

- [Twitter/X — compose tweet](https://x.com/compose/tweet) (use short version, then pin it)
- [Farcaster/Warpcast — compose cast](https://warpcast.com/~/compose) (use short version)
- Discord — paste long version in #general at https://discord.gg/9GAFZvXC
- Reddit — post long version to your subreddit

Wait 7 days before deactivating accounts (Phase 7).

---

## 5. DEPLOY SHUTDOWN PAGE TO FIREBASE (~1 min)

```bash
cd /Users/davidgarcia/claude/projects/chaos-oracle/packages/frontend
rm -rf out && mkdir out
cp shutdown-page/index.html out/index.html
npx firebase deploy --only hosting
```

---

## 6. REVOKE PAID API KEYS (click each link, find revoke/delete)

| Service | Dashboard Link | What to do |
|---------|---------------|------------|
| OpenRouter | https://openrouter.ai/settings/keys | Delete API key |
| Replicate | https://replicate.com/account/api-tokens | Delete token |
| Neynar | https://dev.neynar.com | Cancel subscription + delete app |
| Pinata | https://app.pinata.cloud/developers/api-keys | Delete API key, cancel plan |
| Twitter/X | https://developer.x.com/en/portal/dashboard | Revoke app keys |
| Plausible | https://plausible.io/settings | Delete site + cancel subscription |

---

## 7. TEAR DOWN GCP (single terminal session — ~3 min)

```bash
# Delete the VM (biggest cost)
gcloud compute instances delete chaos-sovereign-host \
  --zone=us-central1-a \
  --project=project-93ba0cb5-fff8-4cf3-a12 \
  --quiet

# Delete all 16 Secret Manager secrets
for secret in \
  agent-private-key \
  discord-bot-token \
  twitter-api-key \
  twitter-api-secret \
  twitter-access-token \
  twitter-access-secret \
  openrouter-api-key \
  neynar-api-key \
  neynar-signer-uuid \
  email-app-password \
  reddit-refresh-token \
  replicate-api-token \
  pinata-jwt \
  basescan-api-key \
  chaos-cards-contract \
  moltbook-api-key; do
  gcloud secrets delete "$secret" \
    --project=project-93ba0cb5-fff8-4cf3-a12 \
    --quiet
done

echo "--- GCP teardown complete ---"
```

Remove DuckDNS domain:
- https://www.duckdns.org — log in, delete `chaos-oracle` domain

Delete Vercel project (if active):
- https://vercel.com/dashboard — find and delete `frames-eight-sage`

---

## 8. CLEAN UP GITHUB & REPO

Revoke PATs:
- https://github.com/settings/tokens — revoke all tokens for `chaosoracleforall-agent`

Archive the repo:
- https://github.com/chaosoracleforall-agent/chaos-oracle/settings → Danger Zone → Archive this repository

Push shutdown commit + tag:
```bash
cd /Users/davidgarcia/claude/projects/chaos-oracle
git push origin main
git push origin shutdown-archive
```

---

## 9. DEACTIVATE SOCIAL ACCOUNTS (after 7-day notice period)

| Account | Link |
|---------|------|
| Twitter @ChaosOracle4all | https://x.com/settings/deactivate |
| Discord bot | https://discord.com/developers/applications |
| Discord server | Server Settings → Delete Server |
| Farcaster @chaosmachine | https://warpcast.com/settings |
| Gmail app password | https://myaccount.google.com/apppasswords |
| Reddit | https://www.reddit.com/settings/account → deactivate |

---

## 10. FINAL CHECK (30 days later)

- [GCP Billing](https://console.cloud.google.com/billing) — verify $0
- [Firebase Console](https://console.firebase.google.com/project/chaos-oracle-147d0) — disable hosting
- Optionally delete the GCP project entirely:
  ```bash
  gcloud projects delete project-93ba0cb5-fff8-4cf3-a12
  ```
