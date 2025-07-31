import { db } from "./db";
import { users, patients, practitioners, appointments, clinicalNotes, invoices } from "../shared/schema";
import bcrypt from "bcrypt";

export async function seedDummyData() {
  console.log("Starting to seed dummy data...");

  try {
    // Create dummy patients with authentic US names
    const patientUsers = [
      {
        email: "sarah.anderson@gmail.com",
        firstName: "Sarah",
        lastName: "Anderson",
        phone: "+1-612-555-0101",
        role: "patient" as const
      },
      {
        email: "james.martinez@outlook.com", 
        firstName: "James",
        lastName: "Martinez",
        phone: "+1-214-555-0102",
        role: "patient" as const
      },
      {
        email: "emily.jackson@yahoo.com",
        firstName: "Emily",
        lastName: "Jackson", 
        phone: "+1-404-555-0103",
        role: "patient" as const
      },
      {
        email: "david.thompson@gmail.com",
        firstName: "David",
        lastName: "Thompson",
        phone: "+1-305-555-0104", 
        role: "patient" as const
      },
      {
        email: "jessica.white@hotmail.com",
        firstName: "Jessica",
        lastName: "White",
        phone: "+1-503-555-0105",
        role: "patient" as const
      },
      {
        email: "robert.williams@gmail.com",
        firstName: "Robert",
        lastName: "Williams",
        phone: "+1-713-555-0106",
        role: "patient" as const
      },
      {
        email: "amanda.garcia@gmail.com",
        firstName: "Amanda",
        lastName: "Garcia",
        phone: "+1-602-555-0107",
        role: "patient" as const
      },
      {
        email: "christopher.taylor@outlook.com",
        firstName: "Christopher",
        lastName: "Taylor",
        phone: "+1-206-555-0108",
        role: "patient" as const
      },
      {
        email: "lisa.moore@gmail.com",
        firstName: "Lisa",
        lastName: "Moore",
        phone: "+1-312-555-0109",
        role: "patient" as const
      },
      {
        email: "kevin.harris@yahoo.com",
        firstName: "Kevin",
        lastName: "Harris",
        phone: "+1-415-555-0110",
        role: "patient" as const
      },
      {
        email: "michelle.clark@gmail.com",
        firstName: "Michelle",
        lastName: "Clark",
        phone: "+1-702-555-0111",
        role: "patient" as const
      },
      {
        email: "brandon.lewis@hotmail.com",
        firstName: "Brandon",
        lastName: "Lewis",
        phone: "+1-617-555-0112",
        role: "patient" as const
      }
    ];

    const hashedPassword = await bcrypt.hash("patient123", 10);

    // Insert patient users
    const createdPatientUsers = [];
    for (const userData of patientUsers) {
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          password: hashedPassword,
        })
        .returning()
        .onConflictDoNothing();
      
      if (user) {
        createdPatientUsers.push(user);
      }
    }

    // Create patient profiles with authentic US addresses and details
    const patientProfiles = [
      {
        dateOfBirth: new Date("1985-03-15"),
        gender: "female",
        address: "1247 Oak Ridge Lane, Minneapolis, MN 55401",
        emergencyContact: "Michael Anderson (Husband) - 612-555-2001",
        insuranceProvider: "Blue Cross Blue Shield",
        insuranceNumber: "BCBS001234567",
        allergies: ["Penicillin", "Shellfish"],
        medicalHistory: ["Hypertension", "Type 2 Diabetes"]
      },
      {
        dateOfBirth: new Date("1992-07-22"),
        gender: "male", 
        address: "3456 Sunset Boulevard, Dallas, TX 75201",
        emergencyContact: "Sofia Martinez (Wife) - 214-555-2002",
        insuranceProvider: "Aetna",
        insuranceNumber: "AET987654321",
        allergies: ["Latex"],
        medicalHistory: ["Asthma"]
      },
      {
        dateOfBirth: new Date("1988-11-08"),
        gender: "female",
        address: "789 Peachtree Street NE, Atlanta, GA 30309", 
        emergencyContact: "Marcus Jackson (Brother) - 404-555-2003",
        insuranceProvider: "Cigna",
        insuranceNumber: "CGN112233445",
        allergies: [],
        medicalHistory: ["Migraines", "Anxiety"]
      },
      {
        dateOfBirth: new Date("1975-05-30"),
        gender: "male",
        address: "521 Biscayne Boulevard, Miami, FL 33132",
        emergencyContact: "Linda Thompson (Wife) - 305-555-2004", 
        insuranceProvider: "United Healthcare",
        insuranceNumber: "UHC556677889",
        allergies: ["Aspirin"],
        medicalHistory: ["High Cholesterol", "Arthritis"]
      },
      {
        dateOfBirth: new Date("1990-09-12"),
        gender: "female",
        address: "2154 Pearl Street, Portland, OR 97205",
        emergencyContact: "Daniel White (Husband) - 503-555-2005",
        insuranceProvider: "Humana", 
        insuranceNumber: "HUM998877665",
        allergies: ["Peanuts"],
        medicalHistory: ["Thyroid Disorder"]
      },
      {
        dateOfBirth: new Date("1982-12-03"),
        gender: "male",
        address: "4987 Westheimer Road, Houston, TX 77027",
        emergencyContact: "Patricia Williams (Wife) - 713-555-2006",
        insuranceProvider: "Kaiser Permanente",
        insuranceNumber: "KP334455667", 
        allergies: ["Sulfa drugs"],
        medicalHistory: ["Diabetes Type 1", "Kidney Stones"]
      },
      {
        dateOfBirth: new Date("1995-02-18"),
        gender: "female",
        address: "1846 North Central Avenue, Phoenix, AZ 85004",
        emergencyContact: "Carlos Garcia (Father) - 602-555-2007",
        insuranceProvider: "Blue Cross Blue Shield",
        insuranceNumber: "BCBS778899001",
        allergies: ["Codeine"],
        medicalHistory: ["Depression", "ADHD"]
      },
      {
        dateOfBirth: new Date("1978-08-25"),
        gender: "male", 
        address: "1635 First Avenue, Seattle, WA 98101",
        emergencyContact: "Rebecca Taylor (Wife) - 206-555-2008",
        insuranceProvider: "Anthem",
        insuranceNumber: "ANT123498765",
        allergies: ["Iodine"],
        medicalHistory: ["Heart Disease", "Sleep Apnea"]
      },
      {
        dateOfBirth: new Date("1987-01-14"),
        gender: "female",
        address: "875 North Michigan Avenue, Chicago, IL 60611",
        emergencyContact: "Steven Moore (Husband) - 312-555-2009",
        insuranceProvider: "Cigna",
        insuranceNumber: "CGN445566778",
        allergies: ["Morphine"],
        medicalHistory: ["Fibromyalgia", "IBS"]
      },
      {
        dateOfBirth: new Date("1980-06-09"),
        gender: "male",
        address: "2567 Van Ness Avenue, San Francisco, CA 94109",
        emergencyContact: "Jennifer Harris (Sister) - 415-555-2010",
        insuranceProvider: "United Healthcare",
        insuranceNumber: "UHC667788990",
        allergies: ["Bee stings"],
        medicalHistory: ["Hypertension", "Gout"]
      },
      {
        dateOfBirth: new Date("1993-04-27"),
        gender: "female",
        address: "4523 Las Vegas Boulevard South, Las Vegas, NV 89109",
        emergencyContact: "Ryan Clark (Boyfriend) - 702-555-2011",
        insuranceProvider: "Aetna",
        insuranceNumber: "AET556677881",
        allergies: ["Amoxicillin"],
        medicalHistory: ["Endometriosis"]
      },
      {
        dateOfBirth: new Date("1986-10-11"),
        gender: "male",
        address: "321 Newbury Street, Boston, MA 02115",
        emergencyContact: "Ashley Lewis (Wife) - 617-555-2012",
        insuranceProvider: "Harvard Pilgrim",
        insuranceNumber: "HP889900112",
        allergies: ["Tree nuts"],
        medicalHistory: ["Seasonal allergies", "Acid reflux"]
      }
    ];

    // Insert patient profiles
    const createdPatients = [];
    for (let i = 0; i < createdPatientUsers.length && i < patientProfiles.length; i++) {
      const [patient] = await db
        .insert(patients)
        .values({
          userId: createdPatientUsers[i].id,
          ...patientProfiles[i]
        })
        .returning()
        .onConflictDoNothing();
      
      if (patient) {
        createdPatients.push(patient);
      }
    }

    // Get existing practitioner
    const [existingPractitioner] = await db
      .select()
      .from(practitioners)
      .limit(1);

    if (!existingPractitioner) {
      console.log("No practitioner found, cannot create appointments and invoices");
      return;
    }

    // Create appointments with varied realistic scenarios
    const appointmentData = [
      {
        title: "Annual Physical Exam",
        appointmentDate: new Date("2025-07-28T09:00:00"),
        status: "scheduled" as const,
        notes: "Comprehensive annual physical with CBC, lipid panel, and A1C labs"
      },
      {
        title: "Diabetes Follow-up",
        appointmentDate: new Date("2025-07-28T10:30:00"), 
        status: "completed" as const,
        notes: "Blood sugar management review, foot exam, medication adjustment"
      },
      {
        title: "Migraine Consultation",
        appointmentDate: new Date("2025-07-29T14:00:00"),
        status: "scheduled" as const,
        notes: "New patient consultation for chronic migraines, discuss preventive options"
      },
      {
        title: "Cardiology Follow-up",
        appointmentDate: new Date("2025-07-30T11:00:00"),
        status: "scheduled" as const, 
        notes: "Review echocardiogram results, blood pressure management"
      },
      {
        title: "Women's Health Exam",
        appointmentDate: new Date("2025-07-31T15:30:00"),
        status: "scheduled" as const,
        notes: "Annual pap smear, breast exam, contraception counseling"
      },
      {
        title: "Hypertension Check",
        appointmentDate: new Date("2025-08-01T08:30:00"),
        status: "scheduled" as const,
        notes: "Blood pressure monitoring, medication effectiveness review"
      },
      {
        title: "Asthma Management",
        appointmentDate: new Date("2025-08-02T13:15:00"),
        status: "scheduled" as const,
        notes: "Inhaler technique review, peak flow assessment, allergy discussion"
      },
      {
        title: "Mental Health Check-in",
        appointmentDate: new Date("2025-08-03T16:00:00"),
        status: "scheduled" as const,
        notes: "Depression screening, medication adjustment, therapy referral"
      },
      {
        title: "Sleep Study Results",
        appointmentDate: new Date("2025-08-05T10:00:00"),
        status: "scheduled" as const,
        notes: "Review sleep apnea study results, CPAP therapy discussion"
      },
      {
        title: "Allergy Consultation",
        appointmentDate: new Date("2025-08-06T14:30:00"),
        status: "scheduled" as const,
        notes: "Seasonal allergy management, immunotherapy options"
      },
      {
        title: "Pain Management Follow-up",
        appointmentDate: new Date("2025-08-07T11:45:00"),
        status: "scheduled" as const,
        notes: "Endometriosis pain assessment, treatment plan review"
      },
      {
        title: "Wellness Visit",
        appointmentDate: new Date("2025-08-08T09:30:00"),
        status: "scheduled" as const,
        notes: "Routine health maintenance, vaccination updates, lifestyle counseling"
      }
    ];

    const createdAppointments = [];
    for (let i = 0; i < Math.min(appointmentData.length, createdPatients.length); i++) {
      const [appointment] = await db
        .insert(appointments)
        .values({
          patientId: createdPatients[i].id,
          practitionerId: existingPractitioner.id,
          ...appointmentData[i]
        })
        .returning()
        .onConflictDoNothing();
      
      if (appointment) {
        createdAppointments.push(appointment);
      }
    }



    // Create clinical notes with detailed SOAP format documentation
    const clinicalNotesData = [
      {
        title: "Annual Physical Examination",
        subjective: "39-year-old female presents for annual physical. Reports feeling well overall with good energy levels. Exercises 3-4 times per week. Some occasional stress from work as a marketing manager. No significant health concerns.",
        objective: "Vital signs: BP 118/76, HR 68, RR 16, Temp 98.4°F, BMI 24.2. General appearance healthy and well-nourished. Heart regular rate and rhythm. Lungs clear bilaterally. Abdomen soft, non-tender.",
        assessment: "Healthy 39-year-old female for routine preventive care. Excellent baseline health status.",
        plan: "Continue current lifestyle. Mammography due next year. Pap smear current. CBC, CMP, lipid panel, TSH ordered. Return for annual exam next year or PRN.",
        additionalNotes: "Diagnosis: Routine health maintenance - Z00.00"
      },
      {
        title: "Diabetes Follow-up",
        subjective: "33-year-old male with Type 2 diabetes returns for quarterly follow-up. Reports good adherence to metformin and lifestyle modifications. Home glucose readings averaging 110-140 mg/dL. Occasional mild hypoglycemic episodes after exercise.",
        objective: "Vital signs stable. Weight decreased 8 lbs since last visit. HbA1c 6.8% (improved from 7.4%). Fasting glucose 128 mg/dL. Diabetic foot exam normal - no ulcers, good sensation.",
        assessment: "Type 2 diabetes mellitus with excellent improvement in glycemic control. Weight loss and lifestyle modifications effective.",
        plan: "Continue metformin 1000mg BID. Reinforce diet and exercise. Ophthalmology referral for diabetic retinal screening. Return in 3 months with home glucose logs.",
        additionalNotes: "Diagnosis: Type 2 diabetes mellitus - E11.9"
      },
      {
        title: "Migraine Consultation",
        subjective: "26-year-old female with chronic migraines presents for new patient consultation. Headaches 2-3 times per week, severe throbbing, photophobia, nausea. Family history of migraines. Stress and lack of sleep are triggers.",
        objective: "Vital signs normal. Neurological exam intact. No focal deficits. HEENT exam normal. Neck supple without meningeal signs.",
        assessment: "Chronic migraine without aura. Likely genetic predisposition with environmental triggers.",
        plan: "Start sumatriptan 50mg for acute episodes. Preventive therapy with topiramate 25mg daily. Headache diary. Sleep hygiene counseling. Follow-up in 4 weeks.",
        additionalNotes: "Diagnosis: Migraine without aura - G43.009"
      },
      {
        title: "Cardiology Follow-up",
        subjective: "49-year-old male with history of hypertension and hyperlipidemia for routine follow-up. Taking lisinopril and atorvastatin. No chest pain, shortness of breath, or palpitations. Recent echocardiogram shows normal EF.",
        objective: "BP 134/82 (improved from 155/95). Heart regular, no murmurs. Peripheral pulses intact. Recent lipid panel: Total cholesterol 185, LDL 110, HDL 52, TG 115.",
        assessment: "Hypertension and hyperlipidemia both improving with current therapy. Blood pressure approaching target.",
        plan: "Continue lisinopril 10mg daily and atorvastatin 20mg daily. Increase lisinopril to 15mg daily. Home BP monitoring. Recheck labs in 3 months.",
        additionalNotes: "Diagnosis: Essential hypertension - I10, Mixed dyslipidemia - E78.2"
      },
      {
        title: "Women's Health Exam",
        subjective: "23-year-old female for annual women's health exam. Sexually active, monogamous relationship. Regular menstrual cycles. Using hormonal contraception. No vaginal discharge, pelvic pain, or urinary symptoms.",
        objective: "Vital signs normal. Breast exam normal, no masses or lymphadenopathy. Pelvic exam normal external genitalia, cervix appears normal. Bimanual exam normal size uterus and adnexa.",
        assessment: "Healthy young woman for routine gynecologic care.",
        plan: "Pap smear obtained, HPV co-testing. Continue current contraception method. STI screening offered. Breast self-exam education. Return in 1 year.",
        additionalNotes: "Diagnosis: Routine gynecological examination - Z01.419"
      },
      {
        title: "Sleep Study Consultation", 
        subjective: "45-year-old male truck driver with obesity and suspected sleep apnea. Wife reports loud snoring and witnessed apneas. Patient experiences daytime fatigue, morning headaches, and difficulty concentrating while driving.",
        objective: "BMI 34.5. Neck circumference 18 inches. Crowded oropharynx with enlarged tonsils. Otherwise normal physical exam. Recent sleep study shows severe OSA with AHI 47.",
        assessment: "Severe obstructive sleep apnea confirmed by sleep study. Obesity contributing factor.",
        plan: "CPAP therapy initiated with auto-titrating pressure. Sleep medicine follow-up in 1 month. Weight loss counseling and nutritionist referral. DOT physical clearance pending CPAP compliance.",
        additionalNotes: "Diagnosis: Obstructive sleep apnea - G47.33"
      },
      {
        title: "Asthma Management",
        subjective: "31-year-old male with asthma since childhood presents for routine follow-up. Using albuterol inhaler 2-3 times per week, more frequently during allergy season. No recent ER visits or oral steroid use.",
        objective: "Vital signs normal. Peak flow 85% of predicted. Lungs clear with good air movement. No wheezing at rest. Proper inhaler technique demonstrated.",
        assessment: "Mild persistent asthma, well-controlled overall but could benefit from controller therapy during allergy season.",
        plan: "Continue albuterol PRN. Add fluticasone inhaler during peak allergy months. Allergy testing referral. Asthma action plan review. Follow-up in 3 months.",
        additionalNotes: "Diagnosis: Mild persistent asthma - J45.20"
      },
      {
        title: "Mental Health Follow-up",
        subjective: "27-year-old female with depression and ADHD for medication management follow-up. Reports improved mood on sertraline but still struggling with concentration and organization at work. Sleep and appetite normal.",
        objective: "Appearance well-groomed. Mood euthymic, affect appropriate. No suicidal ideation. Concentration slightly impaired during interview. PHQ-9 score decreased from 16 to 8.",
        assessment: "Major depression responding well to sertraline. ADHD symptoms persist and impacting work performance.",
        plan: "Continue sertraline 100mg daily. Initiate methylphenidate 10mg BID for ADHD. Therapy referral for CBT. Work accommodation letter provided. Follow-up in 4 weeks.",
        additionalNotes: "Diagnosis: Major depressive disorder - F32.9, ADHD inattentive type - F90.0"
      },
      {
        title: "Rheumatology Consultation",
        subjective: "54-year-old female with chronic fatigue and joint pain for 6 months. Multiple physicians consulted. Pain in hands, wrists, and knees, worse in mornings with stiffness lasting >1 hour. Weight loss 15 lbs.",
        objective: "Low-grade fever 100.2°F. Joint swelling and tenderness in MCPs, PIPs, and wrists bilaterally. Morning stiffness noted. Recent labs: ESR 65, CRP 12.4, RF positive, anti-CCP positive.",
        assessment: "Clinical presentation and lab findings consistent with rheumatoid arthritis. Early aggressive treatment needed.",
        plan: "Rheumatology referral urgent. Start prednisone 15mg daily short-term. Methotrexate to be initiated by rheumatologist. Physical therapy referral. Follow-up in 1 week.",
        additionalNotes: "Diagnosis: Rheumatoid arthritis - M06.9"
      },
      {
        title: "Allergy Management",
        subjective: "35-year-old male software engineer with allergic rhinitis presents during peak pollen season. Sneezing, nasal congestion, itchy watery eyes daily. OTC antihistamines provide minimal relief. Affecting work productivity.",
        objective: "Nasal mucosa edematous and pale. Clear rhinorrhea present. Conjunctival injection bilaterally. No fever. Lungs clear. No sinus tenderness.",
        assessment: "Moderate to severe allergic rhinitis, likely environmental allergens. Poor response to current therapy.",
        plan: "Prescription strength loratadine 10mg daily plus fluticasone nasal spray. Environmental control measures discussed. Allergy testing referral if no improvement. Follow-up in 2 weeks.",
        additionalNotes: "Diagnosis: Allergic rhinitis - J30.9"
      },
      {
        title: "Endometriosis Follow-up",
        subjective: "29-year-old female with endometriosis presents for follow-up. Pelvic pain improved since starting hormonal therapy but still experiences severe dysmenorrhea. Pain impacts work attendance 2-3 days per month.",
        objective: "Vital signs normal. Pelvic exam reveals mild cervical motion tenderness. Uterus slightly tender and retroverted. No palpable masses. Pain scale 3/10 today, 8/10 during menses.",
        assessment: "Endometriosis with partial response to hormonal suppression. Severe dysmenorrhea persists.",
        plan: "Continue current hormonal therapy. Add NSAIDs for dysmenorrhea. Pelvic floor physical therapy referral. Discuss surgical options if conservative management fails. Follow-up in 3 months.",
        additionalNotes: "Diagnosis: Endometriosis - N80.9"
      },
      {
        title: "GERD Consultation",
        subjective: "42-year-old male with seasonal allergies and new onset acid reflux symptoms. Heartburn 3-4 times per week, worse after meals and when lying down. No weight loss, dysphagia, or alarm symptoms.",
        objective: "Vital signs normal. HEENT shows mild nasal congestion. Abdomen soft, non-tender. No lymphadenopathy. Weight stable.",
        assessment: "Gastroesophageal reflux disease, likely dietary and lifestyle related. Seasonal allergic rhinitis stable.",
        plan: "Start omeprazole 20mg daily before breakfast. Lifestyle modifications: elevate head of bed, avoid late meals, reduce caffeine. Continue seasonal allergy management. Follow-up in 6 weeks.",
        additionalNotes: "Diagnosis: GERD - K21.9, Allergic rhinitis - J30.9"
      }
    ];

    const createdClinicalNotes = [];
    for (let i = 0; i < Math.min(clinicalNotesData.length, createdPatients.length); i++) {
      const [note] = await db
        .insert(clinicalNotes)
        .values({
          patientId: createdPatients[i].id,
          practitionerId: existingPractitioner.id,
          appointmentId: createdAppointments[i]?.id || null,
          ...clinicalNotesData[i]
        })
        .returning()
        .onConflictDoNothing();
      
      if (note) {
        createdClinicalNotes.push(note);
      }
    }

    // Create invoices with realistic US healthcare billing scenarios
    const invoiceData = [
      {
        amount: "285.00",
        tax: "22.80", 
        total: "307.80",
        description: "Annual Physical Examination (CPT 99395) - Comprehensive preventive medicine evaluation, age 40-64, including CBC, CMP, lipid panel, TSH, and urinalysis",
        status: "paid" as const,
        dueDate: new Date("2025-08-15"),
        paidAt: new Date("2025-07-25")
      },
      {
        amount: "165.00",
        tax: "13.20",
        total: "178.20", 
        description: "Diabetes Follow-up Visit (CPT 99213) - Office visit with HbA1c review, medication adjustment, and diabetic foot examination",
        status: "paid" as const,
        dueDate: new Date("2025-08-10"),
        paidAt: new Date("2025-07-20")
      },
      {
        amount: "320.00",
        tax: "25.60",
        total: "345.60",
        description: "New Patient Migraine Consultation (CPT 99204) - Comprehensive neurological evaluation with treatment plan development",
        status: "sent" as const,
        dueDate: new Date("2025-08-28")
      },
      {
        amount: "145.00", 
        tax: "11.60",
        total: "156.60",
        description: "Cardiology Follow-up (CPT 99213) - Hypertension management with EKG interpretation and medication review",
        status: "draft" as const,
        dueDate: new Date("2025-08-30")
      },
      {
        amount: "245.00",
        tax: "19.60", 
        total: "264.60",
        description: "Women's Health Exam (CPT 99395, 88142) - Annual gynecological exam with Pap smear and HPV testing",
        status: "overdue" as const,
        dueDate: new Date("2025-07-15")
      },
      {
        amount: "425.00",
        tax: "34.00",
        total: "459.00",
        description: "Sleep Study Consultation (CPT 99204) - CPAP therapy setup and sleep apnea management with equipment",
        status: "paid" as const,
        dueDate: new Date("2025-08-05"),
        paidAt: new Date("2025-07-22")
      },
      {
        amount: "135.00",
        tax: "10.80", 
        total: "145.80",
        description: "Asthma Management (CPT 99212) - Inhaler technique review, peak flow assessment, and medication adjustment",
        status: "sent" as const,
        dueDate: new Date("2025-08-20")
      },
      {
        amount: "195.00",
        tax: "15.60",
        total: "210.60",
        description: "Mental Health Follow-up (CPT 99214) - Depression and ADHD medication management with screening assessments",
        status: "paid" as const,
        dueDate: new Date("2025-08-01"),
        paidAt: new Date("2025-07-24")
      },
      {
        amount: "275.00",
        tax: "22.00",
        total: "297.00",
        description: "Rheumatology Consultation (CPT 99243) - Joint pain evaluation with lab review and treatment initiation",
        status: "sent" as const,
        dueDate: new Date("2025-08-12")
      },
      {
        amount: "125.00",
        tax: "10.00",
        total: "135.00",
        description: "Allergy Management (CPT 99212) - Seasonal allergic rhinitis treatment with prescription therapy",
        status: "paid" as const,
        dueDate: new Date("2025-07-30"),
        paidAt: new Date("2025-07-26")
      },
      {
        amount: "185.00",
        tax: "14.80",
        total: "199.80",
        description: "Endometriosis Follow-up (CPT 99213) - Pelvic pain management and hormonal therapy review",
        status: "draft" as const,
        dueDate: new Date("2025-08-25")
      },
      {
        amount: "155.00",
        tax: "12.40",
        total: "167.40",
        description: "GERD Consultation (CPT 99213) - Acid reflux evaluation with lifestyle counseling and medication initiation",
        status: "sent" as const,
        dueDate: new Date("2025-08-18")
      }
    ];

    for (let i = 0; i < Math.min(invoiceData.length, createdPatients.length); i++) {
      await db
        .insert(invoices)
        .values({
          patientId: createdPatients[i].id,
          practitionerId: existingPractitioner.id,
          appointmentId: createdAppointments[i]?.id || null,
          invoiceNumber: `INV-${Date.now()}-${i + 1}`,
          ...invoiceData[i]
        })
        .onConflictDoNothing();
    }

    console.log(`Successfully seeded dummy data:
    - ${createdPatientUsers.length} patient users
    - ${createdPatients.length} patient profiles  
    - ${createdAppointments.length} appointments
    - ${createdClinicalNotes.length} clinical notes
    - ${invoiceData.length} invoices`);

  } catch (error) {
    console.error("Error seeding dummy data:", error);
  }
}