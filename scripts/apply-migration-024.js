#!/usr/bin/env node

/**
 * Script to apply migration 024 (Food Program missing tables)
 *
 * Usage:
 *   node scripts/apply-migration-024.js
 *
 * This script reads the DATABASE_URL from .env.local or prompts for it.
 * Get your Database URL from:
 *   https://supabase.com/dashboard/project/htvozyxqxmqfnmscfozy/settings/database
 *
 * Alternative: Copy/paste the SQL from supabase/migrations/024_fix_food_program_tables.sql
 * into the Supabase SQL Editor:
 *   https://supabase.com/dashboard/project/htvozyxqxmqfnmscfozy/sql/new
 */

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '024_fix_food_program_tables.sql')

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, answer => { rl.close(); resolve(answer) }))
}

async function main() {
  console.log('\n🔧 Migration 024: Fix Food Program Tables\n')

  // Try to get DATABASE_URL
  let dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    // Try reading from .env.local
    try {
      const envFile = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
      const match = envFile.match(/DATABASE_URL=(.+)/)
      if (match) dbUrl = match[1].trim()
    } catch {}
  }

  if (!dbUrl) {
    console.log('📋 Get your Database URL from:')
    console.log('   https://supabase.com/dashboard/project/htvozyxqxmqfnmscfozy/settings/database')
    console.log('   (Under "Connection string" → "URI")\n')
    dbUrl = await ask('Paste your DATABASE_URL here: ')
  }

  if (!dbUrl) {
    console.log('❌ No DATABASE_URL provided. Exiting.')
    process.exit(1)
  }

  // Read migration SQL
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8')
  console.log(`📄 Loaded migration: ${MIGRATION_FILE}`)
  console.log(`   (${sql.length} characters)\n`)

  // Connect and run
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  })

  try {
    console.log('🔌 Connecting to database...')
    const client = await pool.connect()

    console.log('✅ Connected!\n')
    console.log('🚀 Running migration...\n')

    await client.query(sql)

    console.log('✅ Migration applied successfully!\n')

    // Verify tables exist
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('meal_attendance', 'food_inventory', 'inventory_transactions')
      ORDER BY table_name
    `)

    console.log('📊 Verification:')
    for (const row of rows) {
      console.log(`   ✅ ${row.table_name} — created`)
    }

    const expected = ['food_inventory', 'inventory_transactions', 'meal_attendance']
    const found = rows.map(r => r.table_name)
    const missing = expected.filter(t => !found.includes(t))
    if (missing.length > 0) {
      console.log(`   ⚠️ Still missing: ${missing.join(', ')}`)
    }

    client.release()
    console.log('\n🎉 Done! You can now use the Food Program module.\n')
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message)
    console.log('\n💡 Alternative: Copy/paste the SQL into Supabase SQL Editor:')
    console.log('   https://supabase.com/dashboard/project/htvozyxqxmqfnmscfozy/sql/new\n')
  } finally {
    await pool.end()
  }
}

main()
