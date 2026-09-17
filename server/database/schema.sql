-- Barangay EasyReport Database Schema

DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS hearings CASCADE;
DROP TABLE IF EXISTS summons CASCADE;
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS residents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE residents (
  id SERIAL PRIMARY KEY,
  resident_id VARCHAR(20) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  middle_name VARCHAR(100),
  last_name VARCHAR(100),
  suffix VARCHAR(10),
  birthdate DATE,
  birth_place TEXT,
  age INTEGER,
  gender VARCHAR(20),
  civil_status VARCHAR(50),
  nationality VARCHAR(100),
  religion VARCHAR(100),
  occupation VARCHAR(150),
  address TEXT,
  contact_number VARCHAR(20),
  email VARCHAR(255),
  pwd_id_no VARCHAR(50),
  family_monthly_income VARCHAR(50),
  indigent VARCHAR(10),
  registered_voter VARCHAR(10),
  precinct_no VARCHAR(50),
  voter_id_no VARCHAR(50),
  photo_url TEXT,
  household_number VARCHAR(50),
  emergency_contact VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE complaints (
  id SERIAL PRIMARY KEY,
  complaint_no VARCHAR(20) UNIQUE NOT NULL,
  date_filed DATE DEFAULT CURRENT_DATE,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'Pending',
  description TEXT,
  evidence JSONB DEFAULT '[]',
  complainant_name VARCHAR(255) NOT NULL,
  complainant_address TEXT,
  complainant_contact VARCHAR(20),
  complainant_email VARCHAR(255),
  complainant_age INTEGER,
  respondent_name VARCHAR(255) NOT NULL,
  respondent_address TEXT,
  respondent_contact VARCHAR(20),
  respondent_age INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE summons (
  id SERIAL PRIMARY KEY,
  summon_no VARCHAR(20) UNIQUE NOT NULL,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  hearing_date DATE,
  hearing_time VARCHAR(20),
  venue TEXT,
  officer VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hearings (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  hearing_number INTEGER DEFAULT 1,
  hearing_date DATE,
  hearing_time VARCHAR(20),
  venue TEXT,
  witnesses JSONB DEFAULT '[]',
  mediation_notes TEXT,
  previous_notes TEXT,
  status VARCHAR(50) DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
  recipient VARCHAR(255),
  message TEXT,
  type VARCHAR(50),
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX idx_hearings_complaint_id ON hearings(complaint_id);
CREATE INDEX idx_summons_complaint_id ON summons(complaint_id);
