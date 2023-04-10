import { createInterface } from 'node:readline';

export default async function prompt(message) {
  let rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let promise = new Promise((resolve) => {
    rl.question(message, (answer) => {
      resolve(answer);
      rl.close();
    });
  });

  let answer = await promise;

  return answer;
}
