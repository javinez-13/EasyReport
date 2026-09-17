-- Additive migration: extended resident profile fields.
-- Safe to run multiple times (IF NOT EXISTS). No drops, no resets, no data loss.
ALTER TABLE residents ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS suffix VARCHAR(10);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS birth_place TEXT;
ALTER TABLE residents ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS religion VARCHAR(100);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS occupation VARCHAR(150);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS pwd_id_no VARCHAR(50);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS family_monthly_income VARCHAR(50);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS indigent VARCHAR(10);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS registered_voter VARCHAR(10);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS precinct_no VARCHAR(50);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS voter_id_no VARCHAR(50);
ALTER TABLE residents ADD COLUMN IF NOT EXISTS photo_url TEXT;
