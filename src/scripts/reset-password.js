import { needsBootstrap, bootstrap, changePassword } from '../account-db.js';
import prompt from '../util/prompt.js';

async function promptPassword() {
  let password = await prompt('Enter a password, then press enter: ');

  if (password === '') {
    console.log('Password cannot be empty.');
    return promptPassword();
  }

  let password2 = await prompt('Enter the password again, then press enter: ');

  if (password !== password2) {
    console.log('Passwords do not match.');
    return promptPassword();
  }

  return password;
}

if (needsBootstrap()) {
  console.log(
    'It looks like you don’t have a password set yet. Let’s set one up now!',
  );

  promptPassword().then((password) => {
    let { error } = bootstrap(password);
    if (error) {
      console.log('Error setting password:', error);
      console.log(
        'Please report this as an issue: https://github.com/actualbudget/actual-server/issues',
      );
    } else {
      console.log('Password set!');
    }
  });
} else {
  console.log('It looks like you already have a password set. Let’s reset it!');
  promptPassword().then((password) => {
    let { error } = changePassword(password);
    if (error) {
      console.log('Error changing password:', error);
      console.log(
        'Please report this as an issue: https://github.com/actualbudget/actual-server/issues',
      );
    } else {
      console.log('Password changed!');
      console.log(
        'Note: you will need to log in with the new password on any browsers or devices that are currently logged in.',
      );
    }
  });
}
