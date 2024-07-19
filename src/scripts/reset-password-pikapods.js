import { needsBootstrap, changePassword } from '../account-db.js';
import { prompt, promptPassword, askForPassword } from '../util/prompt.js';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import config from '../load-config.js';

async function resetPasswordPikapods() {
  const r = await spawnSync('sshpass', ['-V']);
  if (r.status !== 0) {
    console.log(
      'Running `sshpass -V` failed. Is sshpass installed? Try running: sudo apt install -y sshpass',
    );
    return 1;
  }
  console.log('To reset the password of your pod, we need some details.');
  console.log(
    'Go to your pod settings -> Files, and enable SFTP Access. Then fill in the details below.',
  );
  const hostname = await prompt(
    'What is the hostname (eg. blue-potato.pikapods.net)? ',
  );
  const username = await prompt('What is the username (eg. p12345)? ');
  const port = await prompt('What is the port (most likely 22)? ');
  const podPwd = await askForPassword('What is the password? ');
  console.log('Thanks. Retrieving auth.sqlite from server...');
  const dbTmpDir = await fs.promises.mkdtemp(join(tmpdir(), 'actual-'));
  const args = `-e scp -s -P ${port} ${username}@${hostname}:/server-files/account.sqlite ${dbTmpDir}`;
  const sshpassOpts = { env: { ...process.env, SSHPASS: podPwd } };
  const r2 = await spawnSync('sshpass', args.split(' '), sshpassOpts);
  if (r2.status !== 0) {
    console.log(`Running \`sshpass ${args}\` failed.`);
    return 1;
  }
  const localAccountsSqlite = join(dbTmpDir, 'account.sqlite');
  const curDate = new Date().toISOString();
  const backupFn = join(dbTmpDir, `account.sqlite.backup-${curDate}`);
  await fs.promises.copyFile(localAccountsSqlite, backupFn);
  // This modifies the global serverFiles config to our temporary dir
  config.serverFiles = dbTmpDir;
  if (needsBootstrap()) {
    console.log(
      "It looks like you don't have a password set yet. Just set it up from the web interface!",
    );
    return 1;
  }
  const password = await promptPassword();
  let { error } = changePassword(password);
  if (error) {
    console.log('Error changing password:', error);
    console.log(
      'Please report this as an issue: https://github.com/actualbudget/actual-server/issues',
    );
    return 1;
  }
  console.log('Uploading account.sqlite to the server...');
  // We first upload and then rename to make the change atomic
  const sftpCommands =
    `put ${backupFn} /server-files/\n` +
    `put ${localAccountsSqlite} /server-files/account.sqlite.tmp\n` +
    `rename /server-files/account.sqlite.tmp /server-files/account.sqlite\n`;
  const commandsFile = join(dbTmpDir, 'sftp-commands');
  fs.writeFileSync(commandsFile, sftpCommands);
  const args2 = `-e sftp -oBatchMode=no -b ${commandsFile} -P ${port} ${username}@${hostname}`;
  const r3 = await spawnSync('sshpass', args2.split(' '), sshpassOpts);
  if (r3.status !== 0) {
    console.log(r3.stderr);
    console.log(`Running \`sshpass ${args2}\` failed.`);
    return 1;
  }
  console.log('Password changed!');
  console.log(
    'Note: you will need to restart the server, and then log out and log in with the new password on any browsers or devices that are currently logged in.',
  );

  return 0;
}

process.exit(await resetPasswordPikapods());
