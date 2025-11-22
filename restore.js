const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

const GITHUB_REPO = 'https://github.com/ahmadfaiz-tech/qrscanner-app.git';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, options = {}) {
  try {
    const result = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return options.silent ? result.trim() : '';
  } catch (error) {
    if (options.ignoreError) {
      return '';
    }
    throw error;
  }
}

function isGitRepo() {
  try {
    execCommand('git rev-parse --git-dir', { silent: true });
    return true;
  } catch {
    return false;
  }
}

function setupGitIfNeeded() {
  if (!isGitRepo()) {
    log('\n⚠ This is not a git repository!', 'red');
    log('Please run save.js first to set up the repository.', 'yellow');
    process.exit(1);
  }

  // Ensure remote is set correctly
  try {
    execCommand(`git remote set-url origin ${GITHUB_REPO}`, { silent: true });
  } catch {
    execCommand(`git remote add origin ${GITHUB_REPO}`, { silent: true });
  }
}

function fetchAllBranches() {
  log('\n🔄 Fetching all branches from GitHub...', 'cyan');
  try {
    execCommand('git fetch origin');
    log('✓ Branches fetched', 'green');
  } catch (error) {
    log('⚠ Warning: Could not fetch from remote', 'red');
    throw error;
  }
}

function getBackupBranches() {
  log('\n🔍 Finding backup branches...', 'cyan');

  const output = execCommand('git branch -r', { silent: true });
  const branches = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('backup-'))
    .map((line) => line.replace('origin/', ''));

  if (branches.length === 0) {
    log('❌ No backup branches found!', 'red');
    log('Please run save.js first to create a backup.', 'yellow');
    process.exit(1);
  }

  log(`✓ Found ${branches.length} backup branch(es)`, 'green');
  return branches;
}

function getLatestBranch(branches) {
  // Sort branches by date (newest first)
  return branches.sort((a, b) => {
    const dateA = a.match(/backup-(\d+)/)?.[1] || '0';
    const dateB = b.match(/backup-(\d+)/)?.[1] || '0';
    return dateB.localeCompare(dateA);
  });
}

function formatTimeAgo(branchName) {
  // Extract timestamp from branch name (format: backup-YYYYMMDDHHMMSS)
  const match = branchName.match(/backup-(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return 'Unknown time';

  const [, year, month, day, hour, minute, second] = match;
  const branchDate = new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );

  const now = new Date();
  const diffMs = now - branchDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day(s) ago`;
  if (diffHours > 0) return `${diffHours} hour(s) ago`;
  if (diffMins > 0) return `${diffMins} minute(s) ago`;
  return 'Just now';
}

function getCommitSubject(branchName) {
  try {
    return execCommand(`git log origin/${branchName} -1 --pretty=%s`, { silent: true });
  } catch {
    return 'No commit message';
  }
}

function displayAllBranches(branches) {
  log('\n' + '='.repeat(80), 'bright');
  log('📋 AVAILABLE BACKUP BRANCHES', 'bright');
  log('='.repeat(80) + '\n', 'bright');

  branches.forEach((branch, index) => {
    const timeAgo = formatTimeAgo(branch);
    const commitSubject = getCommitSubject(branch);

    log(`${colors.yellow}[${index + 1}]${colors.reset} ${colors.cyan}${branch}${colors.reset}`);
    log(`    ⏰ ${timeAgo}`);
    log(`    💬 ${commitSubject}`);
    log('');
  });

  log('='.repeat(80) + '\n', 'bright');
}

function askQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function selectBranch(branches) {
  log('Select a backup branch to restore:', 'cyan');
  log(`Enter a number (1-${branches.length}), or 'q' to quit\n`, 'yellow');

  const answer = await askQuestion('Your choice: ');

  if (answer.toLowerCase() === 'q') {
    log('\n👋 Restore cancelled', 'yellow');
    process.exit(0);
  }

  const choice = parseInt(answer);
  if (isNaN(choice) || choice < 1 || choice > branches.length) {
    log('\n❌ Invalid choice!', 'red');
    return await selectBranch(branches);
  }

  return branches[choice - 1];
}

async function confirmRestore(branchName) {
  log('\n' + '⚠'.repeat(40), 'red');
  log('⚠  WARNING: DESTRUCTIVE OPERATION', 'red');
  log('⚠'.repeat(40) + '\n', 'red');

  log('This will:', 'yellow');
  log(`  • Reset your project to: ${branchName}`, 'yellow');
  log('  • Delete ALL current uncommitted changes', 'yellow');
  log('  • Remove any new files not in the backup', 'yellow');
  log('');

  const answer = await askQuestion('Type "yes" to confirm, or anything else to cancel: ');

  if (answer.toLowerCase() !== 'yes') {
    log('\n👋 Restore cancelled', 'yellow');
    process.exit(0);
  }

  return true;
}

function restoreToBranch(branchName) {
  log(`\n🔄 Restoring to ${branchName}...`, 'cyan');

  // Fetch the specific branch
  log('Fetching branch...', 'yellow');
  execCommand(`git fetch origin ${branchName}:${branchName}`, { ignoreError: true });

  // Checkout to the backup branch
  log('Checking out backup branch...', 'yellow');
  try {
    execCommand(`git checkout ${branchName}`);
  } catch {
    execCommand(`git checkout -b ${branchName} origin/${branchName}`);
  }

  // Go back to main
  log('Switching to main branch...', 'yellow');
  try {
    execCommand('git checkout main', { ignoreError: true });
  } catch {
    execCommand('git checkout -b main', { ignoreError: true });
  }

  // Hard reset to backup branch
  log('Resetting to backup state...', 'yellow');
  execCommand(`git reset --hard ${branchName}`);

  // Clean untracked files
  log('Cleaning untracked files...', 'yellow');
  execCommand('git clean -fd');

  log('✓ Restore complete!', 'green');
}

function ensureRestoreFilesExist() {
  log('\n🔍 Checking restore files...', 'cyan');

  const criticalFiles = ['save.js', 'restore.js', '.vscode/tasks.json'];
  const missingFiles = criticalFiles.filter((file) => !fs.existsSync(file));

  if (missingFiles.length > 0) {
    log(`⚠ Warning: Some restore files are missing: ${missingFiles.join(', ')}`, 'yellow');
    log('You may need to restore these files from the backup branch manually.', 'yellow');
  } else {
    log('✓ All restore files present', 'green');
  }
}

function commitRestoreIfNeeded() {
  log('\n💾 Checking if commit is needed...', 'cyan');

  const status = execCommand('git status --porcelain', { silent: true });
  if (status) {
    log('Changes detected, committing restore...', 'yellow');
    try {
      execCommand('git add -A');
      execCommand(`git commit -m "Restore from backup - ${new Date().toISOString()}"`);
      log('✓ Restore committed', 'green');
    } catch {
      log('⚠ Could not commit restore', 'yellow');
    }
  } else {
    log('✓ No commit needed', 'green');
  }
}

async function main() {
  try {
    log('\n' + '='.repeat(80), 'bright');
    log('🔄 ULTRA SAFE RESTORE - QR Scanner App', 'bright');
    log('='.repeat(80) + '\n', 'bright');

    setupGitIfNeeded();
    fetchAllBranches();

    const branches = getBackupBranches();
    const sortedBranches = getLatestBranch(branches);

    displayAllBranches(sortedBranches);

    const selectedBranch = await selectBranch(sortedBranches);
    log(`\n✓ Selected: ${selectedBranch}`, 'green');

    await confirmRestore(selectedBranch);

    restoreToBranch(selectedBranch);
    ensureRestoreFilesExist();
    commitRestoreIfNeeded();

    log('\n' + '='.repeat(80), 'bright');
    log('✅ RESTORE SUCCESSFUL', 'green');
    log('='.repeat(80) + '\n', 'bright');

    log('📌 Next steps:', 'cyan');
    log('  1. Run: npm install (to restore node_modules)', 'white');
    log('  2. Run: npx react-native run-android (to rebuild app)', 'white');
  } catch (error) {
    log('\n❌ ERROR: ' + error.message, 'red');
    process.exit(1);
  }
}

main();
