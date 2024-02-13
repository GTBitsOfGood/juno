import bcrypt from 'bcrypt';

export function hashPassword(password: string): string {
  const saltRounds = 10;
  const hashedPassword = bcrypt.hashSync(password, saltRounds);
  return hashedPassword;
}

export function isPassword(
  inputPassword: string,
  hashedPassword: string,
): boolean {
  return bcrypt.compareSync(inputPassword, hashedPassword);
}
