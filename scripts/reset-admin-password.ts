/**
 * Script to reset admin password
 * Run with: npx tsx scripts/reset-admin-password.ts
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/utils/password';

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting admin password...\n');

    const username = process.env.ADMIN_USERNAME ?? 'admin';
    const newPassword = process.env.ADMIN_PASSWORD ?? 'admin123';
    const email = process.env.ADMIN_EMAIL ?? `${username}@company.com`;
    const fullName = process.env.ADMIN_FULL_NAME ?? 'System Administrator';
    const city = process.env.ADMIN_CITY ?? 'Riyadh';

    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);

    // Update existing admin user password
    const result = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(users.username, username))
      .returning({ id: users.id, username: users.username });

    if (result.length > 0) {
      console.log('✅ Password reset successful!');
      console.log(`   User: ${result[0].username}`);
      console.log(`   New Password: ${newPassword}`);
      console.log('\n📝 You can now login with:');
      console.log(`   Username: ${username}`);
      console.log(`   Password: ${newPassword}`);
    } else {
      console.log('❌ Admin user not found. Creating new admin user...');
      
      // Create admin user if not exists
      const [newUser] = await db
        .insert(users)
        .values({
          username,
          email,
          password: hashedPassword,
          fullName,
          city,
          role: 'admin',
          isActive: true,
        })
        .returning({ id: users.id, username: users.username });

      console.log('✅ Admin user created!');
      console.log(`   Username: ${newUser.username}`);
      console.log(`   Password: ${newPassword}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
