import { formatSocialDiagnosticsHistory, readSocialDiagnosticsHistory } from './socialDiagnostics';

function main() {
  const limitArg = process.argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : 25;
  const entries = readSocialDiagnosticsHistory(Number.isFinite(limit) ? limit : 25);
  console.log(formatSocialDiagnosticsHistory(entries));
}

main();
