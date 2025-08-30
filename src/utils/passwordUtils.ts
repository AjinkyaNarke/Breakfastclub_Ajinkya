import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns Hashed password
 */
export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Verify a password against a hash
 * @param password - Plain text password to verify
 * @param hash - Stored password hash
 * @returns True if password matches, false otherwise
 */
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a new password hash for updating admin passwords
 * Use this when you want to change admin passwords
 */
export const generateNewPasswordHash = async (newPassword: string): Promise<string> => {
  return await hashPassword(newPassword);
};

// Example usage for updating passwords:
// const newHash = await generateNewPasswordHash('NewPassword123!');
// Then update the database with this new hash
