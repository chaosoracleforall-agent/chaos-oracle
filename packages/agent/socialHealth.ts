import { formatSocialDiagnostics, readSocialDiagnostics } from './socialDiagnostics';

function main() {
  const diagnostics = readSocialDiagnostics();
  const verbose = process.argv.includes('--verbose');
  console.log(formatSocialDiagnostics(diagnostics, verbose));
}

main();
