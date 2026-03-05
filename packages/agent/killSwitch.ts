import fs from 'fs';
import path from 'path';

class KillSwitch {
  private statusFilePath = path.join(__dirname, 'agent_status.json');

  constructor() {
    if (!fs.existsSync(this.statusFilePath)) {
      this.setStatus(true); // Agent is ACTIVE by default
    }
  }

  // Admin function to toggle the agent's state
  setStatus(isActive: boolean) {
    fs.writeFileSync(this.statusFilePath, JSON.stringify({ active: isActive }), 'utf8');
    console.log(`[KILL_SWITCH] Agent Status Changed. Active: ${isActive}`);
  }

  // Every major loop should check this
  checkStatus(): boolean {
    try {
      const data = JSON.parse(fs.readFileSync(this.statusFilePath, 'utf8'));
      if (!data.active) {
        console.warn("[KILL_SWITCH_ACTIVE] The Chaos Oracle is in dormant mode. Skipping execution.");
      }
      return data.active;
    } catch (e) {
      return false; // Fail safe
    }
  }
}

export default new KillSwitch();
