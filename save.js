const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
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

function hasRemoteOrigin() {
  try {
    const remote = execCommand('git remote get-url origin', { silent: true });
    return remote.length > 0;
  } catch {
    return false;
  }
}

function setupGit() {
  log('\n📦 Setting up Git repository...', 'cyan');

  if (!isGitRepo()) {
    log('Initializing new Git repository...', 'yellow');
    execCommand('git init');
  }

  // Configure Git for Windows
  execCommand('git config core.autocrlf false', { ignoreError: true });
  execCommand('git config core.fileMode false', { ignoreError: true });
  execCommand('git config core.ignorecase false', { ignoreError: true });

  // Set up remote origin
  if (hasRemoteOrigin()) {
    log('Updating remote origin...', 'yellow');
    execCommand(`git remote set-url origin ${GITHUB_REPO}`);
  } else {
    log('Adding remote origin...', 'yellow');
    execCommand(`git remote add origin ${GITHUB_REPO}`);
  }

  // Fetch latest from remote
  log('Fetching from remote...', 'yellow');
  execCommand('git fetch origin', { ignoreError: true });

  // Check if main branch exists locally
  const branches = execCommand('git branch', { silent: true });
  if (!branches.includes('main')) {
    log('Creating main branch...', 'yellow');
    execCommand('git checkout -b main', { ignoreError: true });
  } else {
    execCommand('git checkout main', { ignoreError: true });
  }

  log('✓ Git setup complete', 'green');
}

function createSafeGitignore() {
  log('\n📝 Creating .gitignore for React Native project...', 'cyan');

  const gitignoreContent = `# React Native .gitignore

# OSX
.DS_Store

# Node.js
node_modules/
npm-debug.log
yarn-error.log
yarn.log

# React Native
.expo/
.expo-shared/

# Android
android/build/
android/.gradle/
android/.idea/
android/app/build/
android/captures/
android/gradle/
android/gradlew
android/gradlew.bat
*.apk
*.aab
local.properties

# iOS
ios/Pods/
ios/build/
ios/.xcode.env.local
*.ipa
*.dSYM.zip
*.dSYM
DerivedData/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata/
*.xccheckout
*.moved-aside
*.xcuserstate
project.xcworkspace/
!project.xcworkspace/contents.xcworkspacedata

# Metro Bundler
.metro-health-check*
metro-cache/

# Testing
coverage/
.nyc_output/

# Debugging
.vscode/.react/

# Misc
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
*.log
*.lock
*.tmp
*.temp
.cache/

# IDE
.idea/
.vscode/settings.json
.vscode/launch.json
*.swp
*.swo
*~

# Buck
buck-out/
.buckconfig.local
.buckd/

# Watchman
.watchman-config
.watchmanconfig

# Fastlane
ios/fastlane/report.xml
ios/fastlane/Preview.html
ios/fastlane/screenshots
ios/fastlane/test_output

# CocoaPods
ios/Pods/
Podfile.lock

# Generated files
*.jsbundle

# Important: DO NOT ignore these files
!package.json
!package-lock.json
!yarn.lock
!.gitignore
!README.md
!App.tsx
!App.js
!index.js
!babel.config.js
!metro.config.js
!tsconfig.json
!react-native.config.js
!android/app/src/
!android/app/build.gradle
!android/build.gradle
!android/settings.gradle
!ios/*.xcodeproj/
!ios/*.xcworkspace/
!save.js
!restore.js
!.vscode/tasks.json
`;

  fs.writeFileSync('.gitignore', gitignoreContent);
  log('✓ .gitignore created', 'green');
}

function removeUnwantedFiles() {
  log('\n🧹 Removing unwanted files from git...', 'cyan');

  const unwantedPatterns = [
    'node_modules/',
    'android/build/',
    'android/.gradle/',
    'ios/Pods/',
    'ios/build/',
    '.expo/',
    'metro-cache/',
    '*.log',
    '.DS_Store',
  ];

  unwantedPatterns.forEach((pattern) => {
    try {
      execCommand(`git rm -r --cached "${pattern}"`, { silent: true, ignoreError: true });
    } catch (error) {
      // Ignore errors for files that don't exist
    }
  });

  log('✓ Unwanted files removed', 'green');
}

function addImportantFiles() {
  log('\n📂 Adding important files to git...', 'cyan');

  // Important file patterns for React Native
  const filePatterns = [
    '*.js',
    '*.jsx',
    '*.ts',
    '*.tsx',
    '*.json',
    '*.md',
    '*.txt',
    '*.xml',
    '*.gradle',
    '*.podspec',
    '*.plist',
    '*.pbxproj',
    '*.xcworkspacedata',
    '.gitignore',
    '.buckconfig',
    '.flowconfig',
    '.watchmanconfig',
    'babel.config.js',
    'metro.config.js',
    'react-native.config.js',
  ];

  filePatterns.forEach((pattern) => {
    try {
      execCommand(`git add "${pattern}"`, { silent: true, ignoreError: true });
    } catch (error) {
      // Ignore errors
    }
  });

  // Important directories
  const directories = [
    'android/app/src/',
    'ios/',
    'assets/',
    'src/',
    'components/',
    'screens/',
    'navigation/',
    'utils/',
    'services/',
    'config/',
    '.vscode/',
    'screenshots/',
  ];

  directories.forEach((dir) => {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir, { recursive: false });
        if (files.length > 0 && files.length < 1000) {
          execCommand(`git add "${dir}"`, { silent: true, ignoreError: true });
        }
      } catch (error) {
        // Ignore errors
      }
    }
  });

  // Force add critical files
  const criticalFiles = [
    'package.json',
    'package-lock.json',
    'yarn.lock',
    'App.tsx',
    'App.js',
    'index.js',
    'save.js',
    'restore.js',
    '.vscode/tasks.json',
    'README.md',
  ];

  criticalFiles.forEach((file) => {
    if (fs.existsSync(file)) {
      execCommand(`git add -f "${file}"`, { silent: true, ignoreError: true });
    }
  });

  log('✓ Important files added', 'green');
}

function backupCurrentStateSafely() {
  log('\n💾 Preparing backup...', 'cyan');

  removeUnwantedFiles();
  addImportantFiles();

  // Show what will be backed up
  log('\nFiles to be backed up:', 'yellow');
  const status = execCommand('git status --short', { silent: true });
  if (status) {
    console.log(status);
  } else {
    log('No changes to backup', 'yellow');
  }

  log('✓ Backup prepared', 'green');
}

function getCommitTitle() {
  // Check if title was passed as command line argument
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args.join(' ');
  }

  // Interactive prompt for title
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('\n📝 Enter commit title (or press Enter for "Update"): ', (answer) => {
      rl.close();
      resolve(answer.trim() || 'Update');
    });
  });
}

async function commitAndPush() {
  log('\n🚀 Committing and pushing...', 'cyan');

  // Get custom commit title
  const customTitle = await getCommitTitle();
  const timestamp = new Date().toISOString();
  const commitMessage = `${customTitle} - ${timestamp}`;

  // Create backup branch with timestamp
  const backupBranch = `backup-${new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '')}`;

  try {
    // Check if there are changes to commit
    const status = execCommand('git status --porcelain', { silent: true });
    if (!status || status.trim() === '') {
      log('⚠ No changes to commit', 'yellow');
      return;
    }

    // Ensure we're on main branch BEFORE committing
    log('Ensuring we are on main branch...', 'yellow');
    execCommand('git checkout main', { ignoreError: true });

    // Commit changes on main branch FIRST (like nasi-project)
    log(`Committing current state: "${customTitle}"...`, 'yellow');
    try {
      execCommand(`git commit -m "${commitMessage}"`);
      log('✓ Changes committed on main branch', 'green');
    } catch (error) {
      log('⚠ Warning: Could not commit changes', 'red');
      throw error;
    }

    // Create backup branch AFTER committing (for safety)
    log(`Creating backup branch: ${backupBranch}`, 'yellow');
    try {
      execCommand(`git checkout -b ${backupBranch}`, { ignoreError: true });
      execCommand(`git push origin ${backupBranch}`);
      log(`✓ Backup branch created: ${backupBranch}`, 'green');
    } catch (error) {
      log('⚠ Warning: Could not create backup branch', 'yellow');
    }

    // Switch back to main
    log('Switching back to main branch...', 'yellow');
    execCommand('git checkout main');

    // Push DIRECTLY to main (no merge needed since we committed on main)
    log('Pushing to main branch...', 'yellow');
    try {
      execCommand('git push origin main');
      log('✓ Successfully pushed to main branch', 'green');
    } catch (error) {
      if (error.message && error.message.includes('non-fast-forward')) {
        log('⚠ Using force push to main...', 'yellow');
        execCommand('git push origin main --force');
        log('✓ Successfully force pushed to main branch', 'green');
      } else {
        throw error;
      }
    }

    // Clean up local backup branch
    log('Cleaning up local backup branch...', 'yellow');
    try {
      execCommand(`git branch -D ${backupBranch}`, { ignoreError: true });
      log(`✓ Deleted local backup branch: ${backupBranch}`, 'green');
    } catch (error) {
      // Ignore cleanup errors
    }

    // Clean up remote backup branches to avoid "Compare & pull request" prompts
    log('Cleaning up remote backup branches...', 'yellow');
    try {
      const remoteBranches = execCommand('git branch -r', { silent: true });
      const backupBranches = remoteBranches.split('\n')
        .filter(b => b.includes('origin/backup-'))
        .map(b => b.trim().replace('origin/', ''));

      if (backupBranches.length > 0) {
        log(`Found ${backupBranches.length} backup branches to clean up`, 'yellow');
        backupBranches.forEach(branch => {
          try {
            execCommand(`git push origin --delete ${branch}`, { silent: true, ignoreError: true });
            log(`  ✓ Deleted remote branch: ${branch}`, 'green');
          } catch (error) {
            // Ignore errors for branches that might not exist
          }
        });
      }
    } catch (error) {
      // Ignore cleanup errors
    }

    log('\n✨ Backup complete!', 'green');
    log(`\n📌 Backup details:`, 'cyan');
    log(`   Title: ${customTitle}`, 'white');
    log(`   Branch: ${backupBranch}`, 'white');
    log(`   Time: ${timestamp}`, 'white');
    log('\n💡 Semua files sudah di-push terus ke main branch', 'cyan');
    log('💡 Tiada "Compare & pull request" prompt kerana backup branches di-delete', 'cyan');

  } catch (error) {
    log('\n⚠ Warning: Commit/push encountered an error', 'red');
    log(`   Error: ${error.message || error}`, 'red');
    throw error;
  }
}

async function main() {
  try {
    log('\n' + '='.repeat(50), 'bright');
    log('🔒 SAFE BACKUP - QR Scanner App', 'bright');
    log('='.repeat(50) + '\n', 'bright');

    setupGit();
    createSafeGitignore();
    backupCurrentStateSafely();
    await commitAndPush();

    log('\n' + '='.repeat(50), 'bright');
    log('✅ BACKUP SUCCESSFUL', 'green');
    log('='.repeat(50) + '\n', 'bright');
  } catch (error) {
    log('\n❌ ERROR: ' + error.message, 'red');
    process.exit(1);
  }
}

main();
