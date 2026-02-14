/**
 * Run the partitioning + indexes migration SQL against the database.
 * Usage: npx tsx scripts/run-migration.ts
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Running migration SQL...');
  
  const sqlPath = path.join(__dirname, '../prisma/migrations/20260214_partitioning_and_indexes/migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');
  
  // Split into individual statements (skipping comments and empty lines)
  // We need to handle CREATE FUNCTION blocks that contain semicolons
  const statements: string[] = [];
  let current = '';
  let inFunction = false;
  
  for (const line of sql.split('\n')) {
    const trimmed = line.trim();
    
    // Skip pure comment lines at the top level
    if (!inFunction && (trimmed.startsWith('--') || trimmed === '')) {
      if (current.trim()) {
        current += '\n' + line;
      }
      continue;
    }
    
    current += '\n' + line;
    
    // Track function blocks (BEGIN...END)
    if (trimmed.match(/^(CREATE|CREATE OR REPLACE)\s+(FUNCTION|PROCEDURE)/i)) {
      inFunction = true;
    }
    
    if (inFunction && trimmed.match(/\$\$\s*LANGUAGE\s+plpgsql\s*;?/i)) {
      inFunction = false;
      statements.push(current.trim());
      current = '';
      continue;
    }
    
    // Regular statement end (not inside function)
    if (!inFunction && trimmed.endsWith(';') && !trimmed.startsWith('--')) {
      statements.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) {
    statements.push(current.trim());
  }
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (!stmt || stmt.startsWith('--')) continue;
    
    const preview = stmt.substring(0, 80).replace(/\n/g, ' ');
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`  ✅ [${i + 1}/${statements.length}] ${preview}...`);
      successCount++;
    } catch (err: any) {
      // Some statements may fail gracefully (e.g., IF NOT EXISTS)
      const msg = err.message || String(err);
      if (msg.includes('already exists') || msg.includes('does not exist')) {
        console.log(`  ⏭️  [${i + 1}/${statements.length}] Skipped: ${preview}... (${msg.split('\n')[0]})`);
      } else {
        console.error(`  ❌ [${i + 1}/${statements.length}] ${preview}...`);
        console.error(`     Error: ${msg.split('\n')[0]}`);
        errorCount++;
      }
    }
  }
  
  console.log(`\n🎉 Migration completed: ${successCount} succeeded, ${errorCount} failed`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
