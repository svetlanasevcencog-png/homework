import {
  deleteProgram,
  listPrograms,
  loadConfig,
  verifyProgramDeleted,
} from '../../../../support/delete-program';

type CliOptions = {
  ids: string[];
  all: boolean;
  confirm: boolean;
  dryRun: boolean;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    ids: [],
    all: false,
    confirm: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--all') {
      options.all = true;
      continue;
    }
    if (arg === '--confirm') {
      options.confirm = true;
      continue;
    }
    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (arg === '--id') {
      const id = argv[i + 1];
      if (!id) {
        throw new Error('Missing value for --id');
      }
      options.ids.push(id);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return options;
}

function printUsage(): void {
  console.log(`Usage:
  npx tsx .cursor/skills/didaxis-program-deleter/scripts/delete-programs.ts --id <PROGRAM_UUID> [--dry-run]
  npx tsx .cursor/skills/didaxis-program-deleter/scripts/delete-programs.ts --all --dry-run
  npx tsx .cursor/skills/didaxis-program-deleter/scripts/delete-programs.ts --all --confirm`);
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  if (!options.all && options.ids.length === 0) {
    printUsage();
    throw new Error('Provide --id <PROGRAM_UUID> or --all. Bulk delete requires --confirm.');
  }

  if (options.all && !options.dryRun && !options.confirm) {
    throw new Error('Bulk delete requires --confirm. Use --dry-run to preview targets first.');
  }

  const config = loadConfig();
  const programs = options.all ? await listPrograms(config) : [];
  const targetIds = options.all ? programs.map((program) => program.id) : options.ids;

  const scope = options.all ? 'all programs' : 'specific UUID(s)';
  console.log(`Scope: ${scope}`);
  console.log(`Found via GET: ${targetIds.length}`);

  if (targetIds.length === 0) {
    console.log('Deleted: none');
    console.log('Failed: none');
    console.log('Verified missing (GET 404): none');
    console.log('Verification failures: none');
    return;
  }

  if (options.dryRun) {
    console.log('Dry run only — no DELETE requests sent.');
    for (const program of programs.length > 0 ? programs : targetIds.map((id) => ({ id, name: '' }))) {
      const label = 'name' in program && program.name ? `${program.id} (${program.name})` : program.id;
      console.log(`  - ${label}`);
    }
    return;
  }

  const deleted: string[] = [];
  const failed: string[] = [];
  const verified: string[] = [];
  const verificationFailures: string[] = [];

  for (const id of targetIds) {
    const deleteResult = await deleteProgram(config, id);
    if (deleteResult.ok) {
      deleted.push(id);
    } else {
      failed.push(`${id}: ${deleteResult.status} ${deleteResult.message}`);
      continue;
    }

    const verifyResult = await verifyProgramDeleted(config, id);
    if (verifyResult.verified) {
      verified.push(id);
    } else {
      verificationFailures.push(`${id}: ${verifyResult.status} ${verifyResult.message}`);
    }
  }

  console.log(`Deleted: ${deleted.length ? deleted.join(', ') : 'none'}`);
  console.log(`Failed: ${failed.length ? failed.join('; ') : 'none'}`);
  console.log(`Verified missing (GET 404): ${verified.length ? verified.join(', ') : 'none'}`);
  console.log(
    `Verification failures: ${verificationFailures.length ? verificationFailures.join('; ') : 'none'}`,
  );

  if (failed.length > 0 || verificationFailures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  printUsage();
  process.exitCode = 1;
});
