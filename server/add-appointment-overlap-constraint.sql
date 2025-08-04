-- Add constraint to prevent overlapping appointments for the same practitioner
-- This ensures no two appointments can overlap in time for the same practitioner

-- First, create a function to check for overlapping appointments
CREATE OR REPLACE FUNCTION check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are any existing appointments that overlap with the new one
  IF EXISTS (
    SELECT 1 FROM appointments 
    WHERE practitioner_id = NEW.practitioner_id
    AND id != NEW.id  -- Exclude the current appointment (for updates)
    AND appointment_date < (NEW.appointment_date + INTERVAL '1 minute' * NEW.duration)
    AND (appointment_date + INTERVAL '1 minute' * duration) > NEW.appointment_date
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with existing appointment for this practitioner';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before insert or update
DROP TRIGGER IF EXISTS check_appointment_overlap_trigger ON appointments;
CREATE TRIGGER check_appointment_overlap_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION check_appointment_overlap();

-- Add an index to improve performance of overlap checks
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_date 
ON appointments (practitioner_id, appointment_date);

-- Add an index for duration-based queries
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner_date_duration 
ON appointments (practitioner_id, appointment_date, duration); 