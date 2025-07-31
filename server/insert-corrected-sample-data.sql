-- Insert corrected sample data using actual patient IDs

-- Get patient IDs for reference
WITH patient_ids AS (
  SELECT p.id, u.email, ROW_NUMBER() OVER (ORDER BY u.created_at) as rn
  FROM patients p 
  JOIN users u ON p.user_id = u.id 
  LIMIT 10
),
practitioner_id AS (
  SELECT id FROM practitioners LIMIT 1
)

-- Clinical Notes Sample Data
INSERT INTO clinical_notes (patient_id, practitioner_id, title, subjective, objective, assessment, plan)
SELECT 
  p.id,
  pr.id,
  CASE p.rn
    WHEN 1 THEN 'Annual Physical Examination'
    WHEN 2 THEN 'Upper Respiratory Infection'
    WHEN 3 THEN 'Anxiety Depression Follow-up'
    WHEN 4 THEN 'Chronic Back Pain Evaluation'
    WHEN 5 THEN 'Well Child Check - 5 Years'
    WHEN 6 THEN 'Urinary Tract Infection'
    WHEN 7 THEN 'Hypertension Management'
    WHEN 8 THEN 'Acute Migraine Headache'
    WHEN 9 THEN 'Pre-operative Clearance'
    WHEN 10 THEN 'Diabetes Management'
  END,
  CASE p.rn
    WHEN 1 THEN 'Patient reports feeling well overall. Regular exercise routine, balanced diet, good sleep. Current medications: Lisinopril 10mg daily, Metformin 500mg twice daily.'
    WHEN 2 THEN 'Patient presents with 3-day history of nasal congestion, sore throat, low-grade fever max 100.2°F. Mild headache and body aches.'
    WHEN 3 THEN 'Patient returns for GAD and MDD follow-up. Started sertraline 50mg daily 6 weeks ago. Significant mood improvement, better sleep, decreased panic episodes.'
    WHEN 4 THEN 'Chronic low back pain 8 months, 6/10 severity, worse with sitting and bending. Works at desk 8 hours daily. PT for 6 weeks with minimal improvement.'
    WHEN 5 THEN 'Parent reports child doing well. Eating variety, appropriate growth, sleeping 10-11 hours. Starting kindergarten next month.'
    WHEN 6 THEN '2-day history of dysuria, frequency, urgency. Burning with urination, incomplete emptying. No fever or back pain.'
    WHEN 7 THEN 'Following up HTN and hyperlipidemia. Taking amlodipine 5mg daily, atorvastatin 20mg HS. Home BP averaging 135/85.'
    WHEN 8 THEN 'Severe left-sided throbbing headache 4 hours duration. Associated nausea, vomiting, photophobia. Similar to previous migraines but more severe.'
    WHEN 9 THEN 'Scheduled for laparoscopic cholecystectomy. History of gallstones with recurrent biliary colic. Generally healthy.'
    WHEN 10 THEN 'Type 2 DM follow-up. On metformin 1000mg BID and insulin glargine 24 units HS. Home glucose 120-180 fasting.'
  END,
  CASE p.rn
    WHEN 1 THEN 'Vital Signs: BP 128/82 mmHg, HR 72 bpm, Weight 165 lbs, Height 5''6", BMI 26.6. General appearance normal, cardiovascular and pulmonary exam clear.'
    WHEN 2 THEN 'Vital Signs: BP 118/76 mmHg, HR 88 bpm, Temp 99.8°F. Nasal congestion with clear discharge, erythematous posterior pharynx, no lymphadenopathy.'
    WHEN 3 THEN 'Alert, cooperative, appropriate affect. PHQ-9 score: 8 (down from 16). GAD-7 score: 9 (down from 18).'
    WHEN 4 THEN 'Limited forward flexion to 45 degrees, negative SLR bilaterally. Lumbar spine tenderness L4-L5. MRI shows mild DDD L4-L5 with small central disc protrusion.'
    WHEN 5 THEN 'Height 42 inches (50th percentile), Weight 40 lbs (45th percentile), BMI 16.2. Well-appearing, interactive child. Age-appropriate development.'
    WHEN 6 THEN 'Mild suprapubic tenderness, no CVA tenderness. Urinalysis: positive leukocyte esterase, nitrites, >50 WBCs/hpf.'
    WHEN 7 THEN 'BP 138/86 mmHg. Recent labs: Total chol 185, LDL 110, HDL 45, TG 150.'
    WHEN 8 THEN 'Alert and oriented, photophobic. Cranial nerves intact, no focal deficits. No papilledema on fundoscopy.'
    WHEN 9 THEN 'Well-appearing. Cardiovascular: RRR, no murmurs. Pulmonary: CTA bilaterally. Recent labs and EKG normal.'
    WHEN 10 THEN 'No foot ulcers or deformities. Sensation intact to monofilament. Recent HbA1c: 7.2%, microalbumin normal.'
  END,
  CASE p.rn
    WHEN 1 THEN 'Hypertension well controlled. Type 2 DM with good glycemic control. Overweight.'
    WHEN 2 THEN 'Viral upper respiratory infection. No evidence of bacterial infection.'
    WHEN 3 THEN 'GAD and MDD improving on sertraline therapy.'
    WHEN 4 THEN 'Chronic mechanical low back pain secondary to degenerative disc disease L4-L5.'
    WHEN 5 THEN 'Healthy 5-year-old with normal growth and development. Ready for kindergarten.'
    WHEN 6 THEN 'Uncomplicated urinary tract infection, likely cystitis.'
    WHEN 7 THEN 'Hypertension not at goal. Hyperlipidemia improved but LDL above target.'
    WHEN 8 THEN 'Acute migraine headache without aura.'
    WHEN 9 THEN 'Healthy 35-year-old cleared for elective laparoscopic cholecystectomy. Low perioperative risk.'
    WHEN 10 THEN 'Type 2 DM with good overall control. HbA1c slightly above goal.'
  END,
  CASE p.rn
    WHEN 1 THEN 'Continue current medications. Order HbA1c and CMP in 3 months. Dietary counseling provided.'
    WHEN 2 THEN 'Supportive care with rest and fluids. Acetaminophen PRN. Saline nasal rinses. Return if worsening.'
    WHEN 3 THEN 'Continue sertraline 50mg daily. Continue weekly CBT. Follow-up in 4 weeks.'
    WHEN 4 THEN 'Ergonomic evaluation recommended. Gabapentin 300mg TID. Continue PT with core strengthening.'
    WHEN 5 THEN 'Administer DTaP, IPV, MMR vaccines. Vision/hearing screening normal. Next visit at age 6.'
    WHEN 6 THEN 'Prescribed nitrofurantoin 100mg BID x 5 days. Increase fluids. Complete antibiotic course.'
    WHEN 7 THEN 'Increase amlodipine to 10mg daily. Continue atorvastatin. Recheck lipids in 6 weeks.'
    WHEN 8 THEN 'Sumatriptan 6mg SC injection administered. IV fluids and ondansetron for nausea.'
    WHEN 9 THEN 'Cleared for surgery - ASA Class I. NPO after midnight. Post-op follow-up as scheduled.'
    WHEN 10 THEN 'Continue current regimen. Consider increasing insulin to 26 units if AM glucose >130.'
  END
FROM patient_ids p
CROSS JOIN practitioner_id pr;

-- Appointments Sample Data  
WITH patient_ids AS (
  SELECT p.id, u.email, ROW_NUMBER() OVER (ORDER BY u.created_at) as rn
  FROM patients p 
  JOIN users u ON p.user_id = u.id 
  LIMIT 10
),
practitioner_id AS (
  SELECT id FROM practitioners LIMIT 1
)
INSERT INTO appointments (patient_id, practitioner_id, title, description, appointment_date, duration, type, status, notes)
SELECT 
  p.id,
  pr.id,
  CASE p.rn
    WHEN 1 THEN 'Annual Physical Examination'
    WHEN 2 THEN 'URI Follow-up'
    WHEN 3 THEN 'Mental Health Follow-up'
    WHEN 4 THEN 'Back Pain Evaluation'
    WHEN 5 THEN 'Well Child Check'
    WHEN 6 THEN 'UTI Follow-up'
    WHEN 7 THEN 'Hypertension Management'
    WHEN 8 THEN 'Migraine Consultation'
    WHEN 9 THEN 'Post-Surgical Follow-up'
    WHEN 10 THEN 'Diabetes Management'
  END,
  CASE p.rn
    WHEN 1 THEN 'Comprehensive annual physical exam including preventive care screening'
    WHEN 2 THEN 'Follow-up for upper respiratory infection treatment progress'
    WHEN 3 THEN 'Psychiatric follow-up for anxiety and depression management'
    WHEN 4 THEN 'Orthopedic consultation for chronic lower back pain'
    WHEN 5 THEN 'Annual well-child exam with immunizations'
    WHEN 6 THEN 'Follow-up to ensure UTI resolution'
    WHEN 7 THEN 'Blood pressure monitoring and medication adjustment'
    WHEN 8 THEN 'Neurology consultation for recurrent migraines'
    WHEN 9 THEN 'Post-op follow-up after cholecystectomy'
    WHEN 10 THEN 'Quarterly diabetes follow-up with labs'
  END,
  CASE p.rn
    WHEN 1 THEN '2025-08-15 09:00:00'::timestamp
    WHEN 2 THEN '2025-08-02 14:30:00'::timestamp
    WHEN 3 THEN '2025-08-20 11:00:00'::timestamp
    WHEN 4 THEN '2025-08-25 15:00:00'::timestamp
    WHEN 5 THEN '2025-09-10 10:00:00'::timestamp
    WHEN 6 THEN '2025-08-08 16:00:00'::timestamp
    WHEN 7 THEN '2025-08-30 13:00:00'::timestamp
    WHEN 8 THEN '2025-09-05 14:00:00'::timestamp
    WHEN 9 THEN '2025-08-12 11:30:00'::timestamp
    WHEN 10 THEN '2025-09-15 08:30:00'::timestamp
  END,
  CASE p.rn
    WHEN 1 THEN 60
    WHEN 2 THEN 30
    WHEN 3 THEN 30
    WHEN 4 THEN 60
    WHEN 5 THEN 30
    WHEN 6 THEN 15
    WHEN 7 THEN 30
    WHEN 8 THEN 60
    WHEN 9 THEN 30
    WHEN 10 THEN 60
  END,
  CASE p.rn
    WHEN 1 THEN 'consultation'::appointment_type
    WHEN 2 THEN 'follow_up'::appointment_type
    WHEN 3 THEN 'follow_up'::appointment_type
    WHEN 4 THEN 'consultation'::appointment_type
    WHEN 5 THEN 'consultation'::appointment_type
    WHEN 6 THEN 'follow_up'::appointment_type
    WHEN 7 THEN 'follow_up'::appointment_type
    WHEN 8 THEN 'consultation'::appointment_type
    WHEN 9 THEN 'follow_up'::appointment_type
    WHEN 10 THEN 'consultation'::appointment_type
  END,
  CASE p.rn
    WHEN 1 THEN 'confirmed'::appointment_status
    WHEN 2 THEN 'completed'::appointment_status
    WHEN 3 THEN 'confirmed'::appointment_status
    WHEN 4 THEN 'confirmed'::appointment_status
    WHEN 5 THEN 'scheduled'::appointment_status
    WHEN 6 THEN 'scheduled'::appointment_status
    WHEN 7 THEN 'scheduled'::appointment_status
    WHEN 8 THEN 'scheduled'::appointment_status
    WHEN 9 THEN 'completed'::appointment_status
    WHEN 10 THEN 'scheduled'::appointment_status
  END,
  CASE p.rn
    WHEN 1 THEN 'Fasting labs needed at 8:30 AM'
    WHEN 2 THEN 'Patient improved significantly'
    WHEN 3 THEN 'Bring PHQ-9 and GAD-7 questionnaires'
    WHEN 4 THEN 'Bring MRI results and PT notes'
    WHEN 5 THEN 'School physical form needed'
    WHEN 6 THEN 'Urinalysis 15 minutes before appointment'
    WHEN 7 THEN 'Bring home BP log'
    WHEN 8 THEN 'Bring headache diary'
    WHEN 9 THEN 'Surgical sites healing well'
    WHEN 10 THEN 'Fasting required for labs'
  END
FROM patient_ids p
CROSS JOIN practitioner_id pr;

-- Telehealth Sessions Sample Data
WITH patient_ids AS (
  SELECT p.id, u.email, ROW_NUMBER() OVER (ORDER BY u.created_at) as rn
  FROM patients p 
  JOIN users u ON p.user_id = u.id 
  LIMIT 10
),
practitioner_id AS (
  SELECT id FROM practitioners LIMIT 1
)
INSERT INTO telehealth_sessions (patient_id, practitioner_id, platform, meeting_url, meeting_id, status, session_started_at, session_ended_at, session_notes, metadata)
SELECT 
  p.id,
  pr.id,
  CASE p.rn
    WHEN 1 THEN 'zoom'
    WHEN 2 THEN 'teams'
    WHEN 3 THEN 'google_meet'
    WHEN 4 THEN 'zoom'
    WHEN 5 THEN 'teams'
    WHEN 6 THEN 'zoom'
    WHEN 7 THEN 'google_meet'
    WHEN 8 THEN 'teams'
    WHEN 9 THEN 'zoom'
    WHEN 10 THEN 'google_meet'
  END,
  CASE p.rn
    WHEN 1 THEN 'https://zoom.us/j/123456789'
    WHEN 2 THEN 'https://teams.microsoft.com/l/meetup-join/abc123'
    WHEN 3 THEN 'https://meet.google.com/abc-defg-hij'
    WHEN 4 THEN 'https://zoom.us/j/987654321'
    WHEN 5 THEN 'https://teams.microsoft.com/l/meetup-join/def456'
    WHEN 6 THEN 'https://zoom.us/j/456789123'
    WHEN 7 THEN 'https://meet.google.com/xyz-uvwx-yz'
    WHEN 8 THEN 'https://teams.microsoft.com/l/meetup-join/ghi789'
    WHEN 9 THEN 'https://zoom.us/j/789123456'
    WHEN 10 THEN 'https://meet.google.com/qrs-tuvw-xyz'
  END,
  CASE p.rn
    WHEN 1 THEN 'zoom_001'
    WHEN 2 THEN 'teams_002'
    WHEN 3 THEN 'gmeet_003'
    WHEN 4 THEN 'zoom_004'
    WHEN 5 THEN 'teams_005'
    WHEN 6 THEN 'zoom_006'
    WHEN 7 THEN 'gmeet_007'
    WHEN 8 THEN 'teams_008'
    WHEN 9 THEN 'zoom_009'
    WHEN 10 THEN 'gmeet_010'
  END,
  CASE p.rn
    WHEN 1 THEN 'completed'
    WHEN 2 THEN 'completed'
    WHEN 3 THEN 'completed'
    WHEN 4 THEN 'cancelled'
    WHEN 5 THEN 'completed'
    WHEN 6 THEN 'technical_issues'
    WHEN 7 THEN 'scheduled'
    WHEN 8 THEN 'completed'
    WHEN 9 THEN 'completed'
    WHEN 10 THEN 'scheduled'
  END,
  CASE p.rn
    WHEN 1 THEN '2025-07-25 14:00:00'::timestamp
    WHEN 2 THEN '2025-07-26 10:00:00'::timestamp
    WHEN 3 THEN '2025-07-27 16:30:00'::timestamp
    WHEN 4 THEN NULL
    WHEN 5 THEN '2025-07-24 15:00:00'::timestamp
    WHEN 6 THEN '2025-07-28 11:00:00'::timestamp
    WHEN 7 THEN NULL
    WHEN 8 THEN '2025-07-23 08:00:00'::timestamp
    WHEN 9 THEN '2025-07-22 17:00:00'::timestamp
    WHEN 10 THEN NULL
  END,
  CASE p.rn
    WHEN 1 THEN '2025-07-25 14:30:00'::timestamp
    WHEN 2 THEN '2025-07-26 10:45:00'::timestamp
    WHEN 3 THEN '2025-07-27 17:00:00'::timestamp
    WHEN 4 THEN NULL
    WHEN 5 THEN '2025-07-24 15:20:00'::timestamp
    WHEN 6 THEN '2025-07-28 11:15:00'::timestamp
    WHEN 7 THEN NULL
    WHEN 8 THEN '2025-07-23 09:00:00'::timestamp
    WHEN 9 THEN '2025-07-22 17:30:00'::timestamp
    WHEN 10 THEN NULL
  END,
  CASE p.rn
    WHEN 1 THEN 'Telehealth follow-up for hypertension. BP readings reviewed. Patient prefers virtual visits.'
    WHEN 2 THEN 'Mental health counseling via Teams. Discussed coping strategies for work stress.'
    WHEN 3 THEN 'Diabetes education session. Reviewed carb counting and insulin techniques.'
    WHEN 4 THEN 'Patient did not attend scheduled telehealth appointment.'
    WHEN 5 THEN 'Pediatric consultation with parent present. Child healthy, discussed recent cold symptoms.'
    WHEN 6 THEN 'Session terminated early due to connection issues. Rescheduled for in-person.'
    WHEN 7 THEN NULL
    WHEN 8 THEN 'Neurological consultation for migraines. MRI results reviewed via screen sharing.'
    WHEN 9 THEN 'Post-op telehealth follow-up. Patient showed surgical sites via video for inspection.'
    WHEN 10 THEN NULL
  END,
  CASE p.rn
    WHEN 1 THEN '{"duration_minutes": 30, "connection_quality": "excellent", "patient_satisfaction": "high"}'::jsonb
    WHEN 2 THEN '{"duration_minutes": 45, "connection_quality": "good", "therapy_type": "cognitive_behavioral"}'::jsonb
    WHEN 3 THEN '{"duration_minutes": 30, "connection_quality": "fair", "technical_issues": "audio_intermittent"}'::jsonb
    WHEN 4 THEN '{"no_show_reason": "unknown", "contact_attempts": 2, "reschedule_offered": true}'::jsonb
    WHEN 5 THEN '{"duration_minutes": 20, "connection_quality": "excellent", "parent_present": true}'::jsonb
    WHEN 6 THEN '{"duration_minutes": 15, "connection_quality": "poor", "issue_type": "connection_unstable"}'::jsonb
    WHEN 7 THEN '{"pre_visit_prep": true, "reminder_sent": true, "appointment_date": "2025-07-29T13:30:00"}'::jsonb
    WHEN 8 THEN '{"duration_minutes": 60, "connection_quality": "good", "screen_sharing_used": true}'::jsonb
    WHEN 9 THEN '{"duration_minutes": 30, "connection_quality": "excellent", "post_operative": true}'::jsonb
    WHEN 10 THEN '{"diabetes_management": true, "glucose_log_review": true, "appointment_date": "2025-07-30T10:00:00"}'::jsonb
  END
FROM patient_ids p
CROSS JOIN practitioner_id pr;