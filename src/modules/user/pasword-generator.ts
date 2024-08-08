export function random_password_generate(length) {
  const passwordChars =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#!%&';
  return Array(length)
    .fill(passwordChars)
    .map((x) => {
      return x[Math.floor(Math.random() * x.length)];
    })
    .join('');
}
