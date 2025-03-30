-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean initialization)
DROP TABLE IF EXISTS glucose_readings;
DROP TABLE IF EXISTS clinical_notes;
DROP TABLE IF EXISTS appointments;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS users;
DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS risk_level;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'nurse', 'receptionist');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create patients table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    medical_record_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    
    -- Pregnancy information
    estimated_delivery_date DATE,
    weeks_pregnant INTEGER,
    gravida INTEGER, -- Number of pregnancies
    para INTEGER, -- Number of births
    
    -- GDM specific fields
    pre_pregnancy_weight DECIMAL(5,2), -- in kg
    current_weight DECIMAL(5,2), -- in kg
    height DECIMAL(5,2), -- in cm
    bmi DECIMAL(5,2), -- Calculated BMI
    family_history_diabetes BOOLEAN DEFAULT FALSE,
    previous_gdm BOOLEAN DEFAULT FALSE,
    previous_macrosomia BOOLEAN DEFAULT FALSE, -- Previous baby >4kg
    
    -- Risk assessment
    risk_level risk_level DEFAULT 'medium',
    risk_score INTEGER,
    risk_factors TEXT[],
    
    -- Assigned healthcare provider
    primary_provider_id UUID REFERENCES users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE
);

-- Create appointments table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES users(id),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER NOT NULL DEFAULT 30, -- in minutes
    appointment_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled', -- scheduled, completed, cancelled, no-show
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create clinical notes table
CREATE TABLE clinical_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    provider_id UUID NOT NULL REFERENCES users(id),
    note_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note_text TEXT NOT NULL,
    diagnosis TEXT[],
    treatment_plan TEXT,
    followup_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create glucose readings table
CREATE TABLE glucose_readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    reading_time TIME NOT NULL,
    reading_type VARCHAR(20) NOT NULL, -- fasting, pre-meal, post-meal, bedtime
    glucose_value INTEGER NOT NULL, -- in mg/dL
    notes TEXT,
    out_of_range BOOLEAN DEFAULT FALSE,
    is_manually_entered BOOLEAN DEFAULT TRUE,
    device_info VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX idx_patients_risk_level ON patients(risk_level);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_glucose_patient_date ON glucose_readings(patient_id, reading_date);

-- Insert initial admin user (password: admin123)
INSERT INTO users (username, password, email, first_name, last_name, role) 
VALUES ('admin', '$2a$10$eTQVZ7tZETNJsqQvOoTxNeMrnNjA.vAvDsVk2D54aI4jN6L/0wZFu', 'admin@gdm.example.com', 'Admin', 'User', 'admin');

-- Insert sample doctor user (password: doctor123)
INSERT INTO users (username, password, email, first_name, last_name, role) 
VALUES ('doctor', '$2a$10$qGwsKGL4S75d3.Q2Wy0X8eDh/xqcHWnxWl.C9vfKKTMlS3K1ryuNe', 'doctor@gdm.example.com', 'Doctor', 'User', 'doctor');

-- Insert sample nurse user (password: nurse123)
INSERT INTO users (username, password, email, first_name, last_name, role) 
VALUES ('nurse', '$2a$10$bj9TPHDQhxsMRFTzw7x9vOx5xlfDJGIVCXjKFKnvj3E91NzyDpxXK', 'nurse@gdm.example.com', 'Nurse', 'User', 'nurse');

-- Create sample patients for testing
INSERT INTO patients (
    medical_record_number, first_name, last_name, date_of_birth, phone_number, 
    email, estimated_delivery_date, weeks_pregnant, risk_level, 
    pre_pregnancy_weight, height, bmi, family_history_diabetes, 
    previous_gdm, primary_provider_id, created_by
)
SELECT 
    'MRN-' || (1000 + s.a), 
    CASE MOD(s.a, 3) 
        WHEN 0 THEN 'สมหญิง' 
        WHEN 1 THEN 'นงนุช' 
        WHEN 2 THEN 'สุดา' 
    END || ' ' || s.a,
    CASE MOD(s.a, 4) 
        WHEN 0 THEN 'สมใจ' 
        WHEN 1 THEN 'รักดี' 
        WHEN 2 THEN 'มีสุข'
        WHEN 3 THEN 'ใจเย็น'
    END,
    DATE '1985-01-01' + (s.a * 27 % 3650)::integer,
    '08' || (1000000 + s.a)::text,
    'patient' || s.a || '@example.com',
    CURRENT_DATE + ((280 - (s.a * 7 % 35))::integer),
    (s.a * 7 % 35)::integer,
    CASE 
        WHEN s.a % 6 = 0 THEN 'high'::risk_level
        WHEN s.a % 3 = 0 THEN 'medium'::risk_level 
        ELSE 'low'::risk_level
    END,
    50 + (s.a % 30)::decimal,
    150 + (s.a % 30)::decimal,
    (50 + (s.a % 30)) / ((150 + (s.a % 30))/100)^2,
    s.a % 3 = 0,
    s.a % 7 = 0,
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
FROM generate_series(1, 30) AS s(a);

-- Create sample appointments
INSERT INTO appointments (
    patient_id, provider_id, appointment_date, appointment_time,
    appointment_type, status, created_by
)
SELECT
    p.id,
    (SELECT id FROM users WHERE role = 'doctor' LIMIT 1),
    CURRENT_DATE + ((s.a % 14) || ' days')::interval,
    ('08:00'::time + ((s.a % 16) || ' hours')::interval + ((s.a * 15 % 60) || ' minutes')::interval),
    CASE s.a % 3
        WHEN 0 THEN 'Initial Assessment'
        WHEN 1 THEN 'Follow-up'
        WHEN 2 THEN 'Glucose Test'
    END,
    CASE 
        WHEN CURRENT_DATE + ((s.a % 14) || ' days')::interval < CURRENT_DATE THEN 'completed'
        ELSE 'scheduled'
    END,
    (SELECT id FROM users WHERE role = 'receptionist' LIMIT 1)
FROM generate_series(1, 50) AS s(a)
JOIN patients p ON s.a % 30 + 1 = substr(p.medical_record_number, 5)::integer;

-- Create sample glucose readings
INSERT INTO glucose_readings (
    patient_id, reading_date, reading_time, reading_type,
    glucose_value, out_of_range, created_by
)
SELECT
    p.id,
    CURRENT_DATE - ((s.a % 14) || ' days')::interval,
    CASE (s.a % 4)
        WHEN 0 THEN '07:00'::time -- fasting
        WHEN 1 THEN '12:00'::time -- lunch
        WHEN 2 THEN '14:00'::time -- post-lunch
        WHEN 3 THEN '22:00'::time -- bedtime
    END,
    CASE (s.a % 4)
        WHEN 0 THEN 'fasting'
        WHEN 1 THEN 'pre-meal'
        WHEN 2 THEN 'post-meal'
        WHEN 3 THEN 'bedtime'
    END,
    CASE
        WHEN p.risk_level = 'high' THEN 90 + (s.a % 100)
        WHEN p.risk_level = 'medium' THEN 80 + (s.a % 60)
        ELSE 70 + (s.a % 40)
    END,
    CASE
        WHEN p.risk_level = 'high' AND s.a % 3 = 0 THEN TRUE
        WHEN p.risk_level = 'medium' AND s.a % 7 = 0 THEN TRUE
        ELSE FALSE
    END,
    (SELECT id FROM users WHERE role = 'nurse' LIMIT 1)
FROM generate_series(1, 300) AS s(a)
JOIN patients p ON s.a % 30 + 1 = substr(p.medical_record_number, 5)::integer;

-- Create sample clinical notes
INSERT INTO clinical_notes (
    patient_id, appointment_id, provider_id, note_date,
    note_text, diagnosis, treatment_plan
)
SELECT
    a.patient_id,
    a.id,
    a.provider_id,
    a.appointment_date,
    CASE 
        WHEN p.risk_level = 'high' THEN 'ผู้ป่วยมาตามนัด มีระดับน้ำตาลสูงกว่าเกณฑ์ แนะนำให้ควบคุมอาหารและเพิ่มการออกกำลังกาย'
        WHEN p.risk_level = 'medium' THEN 'ผู้ป่วยมาตามนัด ระดับน้ำตาลอยู่ในเกณฑ์ที่ยอมรับได้ ให้คำแนะนำการดูแลตนเอง'
        ELSE 'ผู้ป่วยมาตามนัด สภาพร่างกายปกติ ระดับน้ำตาลอยู่ในเกณฑ์ปกติ'
    END,
    CASE 
        WHEN p.risk_level = 'high' THEN ARRAY['Gestational Diabetes Mellitus', 'Hyperglycemia']
        WHEN p.risk_level = 'medium' THEN ARRAY['Gestational Diabetes Mellitus - controlled']
        ELSE ARRAY['Pregnancy - normal glucose tolerance']
    END,
    CASE 
        WHEN p.risk_level = 'high' THEN 'ควบคุมอาหาร ลดคาร์โบไฮเดรต ออกกำลังกายเบาๆ 30 นาทีต่อวัน ติดตามระดับน้ำตาลวันละ 4 ครั้ง'
        WHEN p.risk_level = 'medium' THEN 'ควบคุมอาหาร ออกกำลังกายสม่ำเสมอ ติดตามระดับน้ำตาลวันละ 2 ครั้ง'
        ELSE 'ติดตามระดับน้ำตาลสัปดาห์ละ 3 ครั้ง ทานอาหารให้ครบ 5 หมู่'
    END
FROM appointments a
JOIN patients p ON a.patient_id = p.id
WHERE a.status = 'completed'
LIMIT 50;

-- Create function to update updated_at field
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_patients_modtime
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_appointments_modtime
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_clinical_notes_modtime
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
