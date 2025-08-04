-- Insert sample invoice data for TiNHiH Healthcare Management System

-- Sample Invoices Data
INSERT INTO invoices (patient_id, practitioner_id, invoice_number, description, amount, tax, total, status, due_date, paid_at, created_at, updated_at) VALUES
-- Paid invoices
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%johnson%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-001', 'Annual Physical Examination - Comprehensive health assessment including lab work and preventive care screening', 150.00, 12.00, 162.00, 'paid', '2025-08-15', '2025-08-10', '2025-07-15 09:00:00', '2025-08-10 14:30:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%smith%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-002', 'URI Follow-up Consultation - Treatment progress evaluation and medication adjustment', 75.00, 6.00, 81.00, 'paid', '2025-08-02', '2025-08-01', '2025-07-20 10:00:00', '2025-08-01 16:45:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%williams%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-003', 'Mental Health Follow-up - Psychiatric evaluation and medication management', 120.00, 9.60, 129.60, 'paid', '2025-08-20', '2025-08-18', '2025-07-25 11:00:00', '2025-08-18 12:15:00'),

-- Sent invoices (not yet paid)
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%brown%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-004', 'Back Pain Evaluation - Orthopedic consultation with MRI review', 200.00, 16.00, 216.00, 'sent', '2025-08-25', NULL, '2025-07-30 14:00:00', '2025-08-05 09:30:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%davis%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-005', 'Well Child Check - Annual pediatric examination with immunizations', 95.00, 7.60, 102.60, 'sent', '2025-09-10', NULL, '2025-08-01 10:30:00', '2025-08-08 11:45:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%miller%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-006', 'UTI Follow-up - Urinalysis and treatment monitoring', 45.00, 3.60, 48.60, 'sent', '2025-08-08', NULL, '2025-08-02 16:00:00', '2025-08-06 14:20:00'),

-- Overdue invoices
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%wilson%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-007', 'Hypertension Management - Blood pressure monitoring and medication adjustment', 85.00, 6.80, 91.80, 'overdue', '2025-07-30', NULL, '2025-07-15 13:00:00', '2025-07-30 15:00:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%moore%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-008', 'Migraine Consultation - Neurology evaluation and treatment plan', 180.00, 14.40, 194.40, 'overdue', '2025-07-25', NULL, '2025-07-10 14:30:00', '2025-07-25 10:15:00'),

-- Draft invoices
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%taylor%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-009', 'Post-Surgical Follow-up - Post-operative care and wound assessment', 65.00, 5.20, 70.20, 'draft', '2025-08-12', NULL, '2025-08-01 11:30:00', '2025-08-01 11:30:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%anderson%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-010', 'Diabetes Management - Quarterly follow-up with lab work', 110.00, 8.80, 118.80, 'draft', '2025-09-15', NULL, '2025-08-05 08:30:00', '2025-08-05 08:30:00'),

-- Additional invoices for variety
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%johnson%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-011', 'Lab Work - Comprehensive metabolic panel and lipid profile', 125.00, 10.00, 135.00, 'sent', '2025-08-20', NULL, '2025-08-10 09:00:00', '2025-08-12 14:30:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%smith%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-012', 'Telehealth Consultation - Virtual follow-up appointment', 60.00, 4.80, 64.80, 'paid', '2025-08-05', '2025-08-03', '2025-07-28 15:00:00', '2025-08-03 16:45:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%williams%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-013', 'Medication Management - Psychiatric medication adjustment', 90.00, 7.20, 97.20, 'sent', '2025-08-28', NULL, '2025-08-15 11:00:00', '2025-08-18 12:15:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%brown%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-014', 'Physical Therapy Session - Back pain rehabilitation', 85.00, 6.80, 91.80, 'overdue', '2025-07-20', NULL, '2025-07-05 14:00:00', '2025-07-20 10:15:00'),
((SELECT id FROM patients WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%davis%') LIMIT 1), (SELECT id FROM practitioners LIMIT 1), 'INV-2025-015', 'Vaccination Services - Childhood immunizations', 75.00, 6.00, 81.00, 'paid', '2025-08-01', '2025-07-30', '2025-07-25 10:30:00', '2025-07-30 16:45:00'); 