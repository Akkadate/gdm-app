-- สร้างฐานข้อมูล
CREATE DATABASE gdm_db;

-- เชื่อมต่อกับฐานข้อมูล
\c gdm_db;

-- ตาราง roles (บทบาท)
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง users (ผู้ใช้งาน)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    hospital_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง patients (ข้อมูลผู้ป่วย)
CREATE TABLE patients (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date_of_birth DATE NOT NULL,
    gestational_age_at_diagnosis INTEGER, -- อายุครรภ์ตอนวินิจฉัย (สัปดาห์)
    expected_delivery_date DATE,
    pre_pregnancy_weight DECIMAL(5,2), -- น้ำหนักก่อนตั้งครรภ์ (กก.)
    height DECIMAL(5,2), -- ส่วนสูง (ซม.)
    blood_type VARCHAR(5),
    previous_gdm BOOLEAN DEFAULT FALSE, -- ประวัติเบาหวานขณะตั้งครรภ์
    family_diabetes_history BOOLEAN DEFAULT FALSE, -- ประวัติเบาหวานในครอบครัว
    nurse_id INTEGER REFERENCES users(id), -- พยาบาลที่ดูแล
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง glucose_readings (ค่าระดับน้ำตาลในเลือด)
CREATE TABLE glucose_readings (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    reading_date DATE NOT NULL,
    reading_time TIME NOT NULL,
    glucose_value DECIMAL(5,2) NOT NULL, -- ค่าน้ำตาล (mg/dL)
    reading_type VARCHAR(50) NOT NULL, -- ก่อนอาหารเช้า, หลังอาหารเช้า, ก่อนอาหารกลางวัน, หลังอาหารกลางวัน, ก่อนอาหารเย็น, หลังอาหารเย็น, ก่อนนอน
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง meals (บันทึกอาหาร)
CREATE TABLE meals (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    meal_date DATE NOT NULL,
    meal_time TIME NOT NULL,
    meal_type VARCHAR(50) NOT NULL, -- มื้อเช้า, มื้อกลางวัน, มื้อเย็น, อาหารว่าง
    carbohydrate_amount DECIMAL(5,2), -- ปริมาณคาร์โบไฮเดรต (กรัม)
    food_items TEXT NOT NULL, -- รายละเอียดอาหารที่รับประทาน
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง physical_activities (กิจกรรมทางกาย)
CREATE TABLE physical_activities (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    activity_type VARCHAR(100) NOT NULL, -- ประเภทกิจกรรม
    duration INTEGER NOT NULL, -- ระยะเวลา (นาที)
    intensity VARCHAR(50) NOT NULL, -- ความเข้มข้น (เบา, ปานกลาง, หนัก)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง weight_records (บันทึกน้ำหนัก)
CREATE TABLE weight_records (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    weight DECIMAL(5,2) NOT NULL, -- น้ำหนัก (กก.)
    gestational_age INTEGER, -- อายุครรภ์ (สัปดาห์)
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง appointments (การนัดหมาย)
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    appointment_type VARCHAR(100) NOT NULL, -- ประเภทการนัด
    location VARCHAR(255),
    notes TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง glucose_targets (เป้าหมายระดับน้ำตาล)
CREATE TABLE glucose_targets (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    target_type VARCHAR(50) NOT NULL, -- ก่อนอาหาร, หลังอาหาร
    min_value DECIMAL(5,2) NOT NULL,
    max_value DECIMAL(5,2) NOT NULL,
    set_by INTEGER REFERENCES users(id), -- ผู้กำหนดเป้าหมาย (พยาบาล)
    effective_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง treatments (การรักษา)
CREATE TABLE treatments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    treatment_date DATE NOT NULL,
    treatment_type VARCHAR(100) NOT NULL, -- การให้คำปรึกษา, การปรับยา, อื่นๆ
    details TEXT NOT NULL,
    nurse_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ตาราง medications (ยา)
CREATE TABLE medications (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    prescribed_by INTEGER REFERENCES users(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- เพิ่มข้อมูลเริ่มต้น: บทบาท
INSERT INTO roles (name) VALUES ('admin'), ('nurse'), ('patient');