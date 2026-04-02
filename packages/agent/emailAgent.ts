import nodemailer from 'nodemailer';
import Imap from 'imap';
import { simpleParser } from 'mailparser';
import * as dotenv from 'dotenv';
dotenv.config();

class EmailAgent {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL,
        pass: process.env.AGENT_EMAIL_APP_PASSWORD,
      },
    });
  }

  async sendPredatoryEmail(to: string, subject: string, text: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"Chaos Oracle" <${process.env.EMAIL}>`,
        to,
        subject,
        text,
      });
      console.log(`[EMAIL_AGENT] Comm sent to ${to}. Message ID: ${info.messageId}`);
    } catch (error) {
      console.error("[EMAIL_AGENT_ERROR]: Failed to dispatch email.", error);
    }
  }

  // AGENT UPGRADE: READING CAPABILITY
  async readVerificationEmail(senderFilter: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const imap = new Imap({
        user: process.env.EMAIL!,
        password: process.env.AGENT_EMAIL_APP_PASSWORD!,
        host: 'imap.gmail.com',
        port: 993,
        tls: true
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) return reject(err);
          imap.search(['UNSEEN', ['FROM', senderFilter]], (err, results) => {
            if (err || !results.length) {
              imap.end();
              return resolve(null);
            }
            const f = imap.fetch(results.slice(-1), { bodies: '' });
            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  imap.end();
                  resolve(parsed.text || null);
                });
              });
            });
          });
        });
      });

      imap.once('error', (err: any) => reject(err));
      imap.connect();
    });
  }

  // Poll inbox for platform notifications (Reddit mods, Discord alerts, etc.)
  // Uses two sequential IMAP searches (Reddit, then Discord) to avoid
  // node-imap OR syntax issues. 45s timeout, proper cleanup on all paths.
  async checkPlatformNotifications(): Promise<{ reddit: string[]; discord: string[]; other: string[] }> {
    const results = { reddit: [] as string[], discord: [] as string[], other: [] as string[] };

    if (!process.env.EMAIL || !process.env.AGENT_EMAIL_APP_PASSWORD) {
      return results;
    }

    // Search for one sender at a time to avoid IMAP OR syntax issues
    const senders = [
      { filter: 'noreply@reddit.com', bucket: 'reddit' as const },
      { filter: 'noreply@discordapp.com', bucket: 'discord' as const },
    ];

    for (const sender of senders) {
      try {
        const msgs = await this._fetchUnseenFrom(sender.filter);
        for (const msg of msgs) {
          results[sender.bucket].push(msg);
          console.log(`[EMAIL_AGENT] ${sender.bucket} notification: ${msg.slice(0, 120)}`);
        }
      } catch (err: any) {
        console.error(`[EMAIL_AGENT] Failed to check ${sender.bucket} emails:`, err.message);
      }
    }

    return results;
  }

  // Fetch unseen emails from a specific sender. Returns summaries.
  // Handles IMAP lifecycle with guaranteed cleanup.
  private _fetchUnseenFrom(senderFilter: string): Promise<string[]> {
    return new Promise((resolve) => {
      const summaries: string[] = [];
      let resolved = false;
      const safeResolve = (val: string[]) => {
        if (resolved) return;
        resolved = true;
        clearTimeout(timer);
        try { imap.end(); } catch {}
        resolve(val);
      };

      const imap = new Imap({
        user: process.env.EMAIL!,
        password: process.env.AGENT_EMAIL_APP_PASSWORD!,
        host: 'imap.gmail.com',
        port: 993,
        tls: true,
      });

      // 45s timeout — Gmail can be slow; parsing 10 emails takes time
      const timer = setTimeout(() => safeResolve(summaries), 45000);

      imap.once('error', () => safeResolve(summaries));

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err) => {
          if (err) return safeResolve(summaries);

          imap.search(['UNSEEN', ['FROM', senderFilter]], (err, uids) => {
            if (err || !uids || !uids.length) return safeResolve(summaries);

            const toFetch = uids.slice(-10);
            const f = imap.fetch(toFetch, { bodies: '', markSeen: true });
            let pending = toFetch.length;

            f.on('message', (msg) => {
              msg.on('body', (stream) => {
                simpleParser(stream, (err, parsed) => {
                  pending--;
                  if (!err && parsed) {
                    const subject = parsed.subject || '(no subject)';
                    const body = (parsed.text || '').slice(0, 300);
                    summaries.push(`[${subject}] ${body}`);
                  }
                  if (pending <= 0) safeResolve(summaries);
                });
              });
            });

            f.once('error', () => safeResolve(summaries));
            // Safety: if fetch ends but some parses haven't completed,
            // give 5s grace then resolve with what we have
            f.once('end', () => {
              setTimeout(() => safeResolve(summaries), 5000);
            });
          });
        });
      });

      imap.connect();
    });
  }
}

export default new EmailAgent();
