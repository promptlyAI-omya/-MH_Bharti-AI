-- 1. Create `topic_content` table
CREATE TABLE IF NOT EXISTS topic_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_name TEXT NOT NULL,
  exam TEXT NOT NULL,
  concept_marathi TEXT NOT NULL,
  trick_marathi TEXT NOT NULL,
  example_q1 TEXT NOT NULL,
  example_q1_steps TEXT NOT NULL,
  example_q2 TEXT NOT NULL,
  example_q2_steps TEXT NOT NULL,
  svg_visual TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Alter `questions` table to add new columns
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS step_by_step_solution TEXT,
ADD COLUMN IF NOT EXISTS trick_used TEXT,
ADD COLUMN IF NOT EXISTS question_purpose TEXT CHECK (question_purpose IN ('example', 'practice')) DEFAULT 'practice';

-- 3. Seed data for "टक्केवारी" (Percentage)
INSERT INTO topic_content (
  topic_name, 
  exam, 
  concept_marathi, 
  trick_marathi, 
  example_q1, 
  example_q1_steps, 
  example_q2, 
  example_q2_steps
) VALUES (
  'टक्केवारी',
  'police',
  'टक्केवारी म्हणजे 100 मधील भाग. % = per hundred',
  'टक्केवारी = (भाग/एकूण) × 100\nजलद trick:\n10% = संख्या ÷ 10\n5% = 10% ÷ 2\n15% = 10% + 5%',
  '75 पैसे हे 3 रुपयांचे किती टक्के?',
  'Step 1: 3 रुपये = 300 पैसे\nStep 2: (75/300) × 100\nStep 3: 25%\nउत्तर: 25% ✅',
  'एका परीक्षेत 400 पैकी 320 गुण मिळाले, तर किती टक्के गुण मिळाले?',
  'Step 1: एकूण गुण = 400, मिळालेले गुण = 320\nStep 2: (320/400) × 100\nStep 3: (32/40) × 100 = 80%\nउत्तर: 80% ✅'
);

-- 4. Seed data for "आकृती मोजणी" (Figure Counting)
INSERT INTO topic_content (
  topic_name, 
  exam, 
  concept_marathi, 
  trick_marathi, 
  example_q1, 
  example_q1_steps, 
  example_q2, 
  example_q2_steps,
  svg_visual
) VALUES (
  'आकृती मोजणी',
  'police',
  'आकृतीतील त्रिकोण किंवा चौकोन मोजण्याची पद्धत',
  'छोटे त्रिकोण आधी मोजा + मोठे त्रिकोण मोजा + एकत्रित तयार होणारे मोजा. सगळे वेगळे मोजा.',
  'खालील आकृतीत किती त्रिकोण आहेत?',
  'Step 1: बेस लाईनवरील छोटे भाग मोजा (उदा. 1, 2, 3)\nStep 2: 1 + 2 + 3 करा\nStep 3: 6\nउत्तर: 6 त्रिकोण ✅',
  'चौरसात दोन्ही कर्ण जोडले असतील तर किती त्रिकोण?',
  'Step 1: आतील छोटे त्रिकोण मोजा = 4\nStep 2: 4 × 2 करा\nStep 3: 8\nउत्तर: 8 त्रिकोण ✅',
  '<svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><polygon points="50,10 10,90 90,90" fill="none" stroke="currentColor" stroke-width="2"/><line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" stroke-width="2"/></svg>'
);
