import csv
import re

csv_file = r"c:\Users\Mr.Comp\Desktop\Coding\MH_Bharti AI\QnAData\all_police_papers_data.csv"
output_file = r"c:\Users\Mr.Comp\Desktop\Coding\MH_Bharti AI\QnAData\clean_police_mcq.csv"

# =====================================================
# SUBJECT DETECTION KEYWORDS (Marathi + English)
# =====================================================

MATH_KEYWORDS = [
    'सरासरी', 'संख्या', 'गुणाकार', 'भागाकार', 'बेरीज', 'वजाबाकी',
    'टक्के', 'व्याज', 'नफा', 'तोटा', 'क्षेत्रफळ', 'परिमिती',
    'त्रिकोण', 'आयत', 'चौरस', 'वर्ग', 'अपूर्णांक', 'दशांश',
    'गुणोत्तर', 'प्रमाण', 'कि.मी', 'किमी', 'मीटर', 'सेंमी',
    'सें.मी', 'लीटर', 'रुपये', 'किंमत', 'वेग', 'अंतर',
    'काम', 'दिवस', 'तास', 'मिनिट', 'सेकंद',
    'भाग जाणाऱ्या', 'विभाज्य', 'मूळ संख्या', 'सम संख्या',
    'विषम', 'घन', 'वर्गमूळ', 'चक्रवाढ', 'सरळव्याज',
    'हप्त', 'कर्ज', 'फरश', 'खांब', 'रेशन', 'युनिट',
    'गाडी', 'ट्रेन', 'कार', 'प्रवास', 'प्रतितास',
    'कोटी', 'लाख', 'हजार', 'पट', 'किंमत',
    'दुध', 'लिटर', 'बिल',
]

MARATHI_KEYWORDS = [
    'वाक्यप्रचार', 'म्हण', 'संधी', 'समास', 'विभक्ती', 'प्रत्यय',
    'अलंकार', 'वृत्त', 'काळ', 'वचन', 'लिंग', 'नाम', 'सर्वनाम',
    'विशेषण', 'क्रियापद', 'क्रियाविशेषण', 'अव्यय', 'शब्दयोगी',
    'उभयान्वयी', 'केवलप्रयोगी', 'प्रयोग', 'कर्तरी', 'कर्मणी',
    'भावे', 'वाक्य', 'मिश्रवाक्य', 'संयुक्त', 'केवलवाक्य',
    'शब्द', 'अर्थ', 'विरुद्धार्थी', 'समानार्थी', 'लेखक',
    'कवी', 'काव्य', 'पुस्तक', 'रस', 'उपमा', 'रूपक',
    'अतिशयोक्ती', 'दृष्टांत', 'उत्प्रेक्षा', 'श्लेष',
    'सामान्यरूप', 'सामान्य रुप', 'शुद्ध', 'अशुद्ध',
    'भाषा', 'तत्सम', 'तद्भव', 'देशी', 'परभाषा',
    'वर्णमाला', 'व्यंजन', 'स्वर', 'ओष्ठय', 'दंत्य',
    'मूर्धन्य', 'तालव्य', 'नामसाधित', 'धातुसाधित',
    'अव्ययसाधित', 'गुणादेश', 'यणादेश', 'लोप',
    'प्रकार ओळखा', 'वाक्यातील', 'अधोरेखित',
    'पंक्ती', 'गीत', 'कर्ते', 'लिहिल्यास',
    'पर्यायी', 'म्हणतात', 'अलंकाराचा',
    'बहुवचन', 'एकवचन', 'विशेषनाम', 'सामान्यनाम',
    'भाववाचक', 'संबोधन', 'सप्तमी', 'प्रथमा', 'षष्टी',
    'तृतीया', 'चतुर्थी', 'पंचमी', 'द्वितीया',
    'तत्पुरुष', 'बहुव्रीही', 'द्विगु', 'अव्ययीभाव', 'द्वंद्व',
]

REASONING_KEYWORDS = [
    'अंकमाला', 'अंकमालिका', 'मालिका', 'श्रेणी',
    'प्रश्नचिन्ह', 'प्रश्‍नचिन्ह', 'जागी कोणती',
    'सांकेतिक', 'संकेत', 'लिपी', 'कोड',
    'दिशा', 'वायव्य', 'ईशान्य', 'अग्नेय', 'नैऋत्य',
    'उत्तर', 'दक्षिण', 'पूर्व', 'पश्चिम', 'तोंड करून',
    'छायाचित्र', 'नाते', 'बाप', 'मुलगा', 'मुलगी',
    'आई', 'भाऊ', 'बहिण', 'काका',
    'रांग', 'क्रमांक', 'डावीकडे', 'उजवीकडे',
    'वळलात', 'काटकोन', 'फिरला',
    'विसंगत', 'गटात न बसणारा', 'वेगळेपण',
    'युक्तिवाद', 'विधान', 'अनुमान', 'निष्कर्ष',
    'तार्किक', 'फासा', 'घड्याळ',
    'काटा', 'मिनिट काटा', 'तास काटा', 'कोन',
    'आरशात', 'प्रतिबिंब',
    'चुकीची संख्या', 'न वसणारा',
    'शब्दगटात', 'क्रमवार',
    'जलद', 'धावणारी', 'धावतो',
    'बसल्या', 'मध्यभागी',
]

GK_KEYWORDS = [
    'राज्य', 'देश', 'शहर', 'नदी', 'जिल्हा', 'तालुका',
    'महाराष्ट्र', 'भारत', 'पंतप्रधान', 'राष्ट्रपती', 'मुख्यमंत्री',
    'निवडणूक', 'संविधान', 'घटना', 'कलम', 'अनुच्छेद',
    'विधानसभा', 'लोकसभा', 'राज्यसभा', 'संसद',
    'पोलीस', 'आयुक्त', 'अधीक्षक', 'न्यायालय',
    'गड', 'किल्ला', 'शिवराय', 'शिवाजी', 'राज्याभिषेक',
    'ऑलिम्पिक', 'पुरस्कार', 'ऑस्कर', 'नोबेल',
    'चलन', 'राजधानी', 'लोकसंख्या',
    'सध्या', 'सध्याचे', 'कोण आहेत',
    'कोणत्या ठिकाणी', 'कोणत्या शहरात', 'कोणत्या जिल्ह्यात',
    'आरक्षण', 'दुरुस्ती', 'कायदा',
    'स्वातंत्र्य', 'क्रांतिवीर', 'स्वातंत्र्यसैनिक',
    'सैन्य', 'भूदल', 'नौदल', 'वायुदल',
    'अकादमी', 'अँकेडमी',
    'नॅशनल पार्क', 'अभयारण्य',
    'मतदार', 'नागरिकत्व', 'मूलभूत',
    'आपत्ती', 'व्यवस्थापन',
    'धरण', 'महामार्ग', 'समृद्धी',
    'ब्रिक्स', 'संयुक्त राष्ट्र',
    'काँग्रेस', 'अध्यक्ष', 'संमेलन',
    'वेद', 'इतिहास', 'संस्कृती', 'हडप्पा',
    'शास्त्रज्ञ', 'आइनस्टाइन', 'न्युटन', 'एडिसन',
    'अर्थशास्त्र', 'जनक',
    'खनिज', 'मृदा', 'पठार', 'किनारपट्टी',
    'उपनदी', 'गोदावरी', 'कृष्णा', 'नर्मदा',
    'लढा', 'सशस्त्र', 'फडके', 'सावरकर',
    'विज्ञान दिन', 'राष्ट्रीय',
    'अग्निशामक', 'चुंबकीय',
    'माहिती अधिकार', 'कॅबिनेट',
]

SCIENCE_KEYWORDS = [
    'जीवनसत्व', 'विटामिन', 'प्रथिने', 'कार्बोदके',
    'रोग', 'आजार', 'लस', 'रक्त', 'हृदय',
    'पेशी', 'ऊती', 'अवयव', 'शरीर',
    'वनस्पती', 'प्राणी', 'सजीव', 'निर्जीव',
    'रासायनिक', 'मूलद्रव्य', 'संयुग', 'मिश्रण',
    'आम्ल', 'आम्लारी', 'क्षार', 'लवण',
    'धातू', 'अधातू', 'ऑक्सिजन', 'हायड्रोजन',
    'नायट्रोजन', 'कार्बन', 'लोह', 'तांबे',
    'विद्युत', 'चुंबक', 'प्रकाश', 'ध्वनी',
    'ऊर्जा', 'बल', 'गती', 'वेग',
    'गुरुत्व', 'दाब', 'तापमान', 'उष्णता',
    'अणु', 'रेणू', 'परमाणू',
    'प्रदूषण', 'पर्यावरण', 'हवा', 'पाणी',
    'वायू', 'द्रव', 'घन', 'स्थिती',
    'रोध', 'विभवांतर', 'परिपथ',
    'हॅलोजन', 'कुल', 'आवर्त',
    'उष्मता', 'ज्युल', 'कॅलरी',
    'अपेंडिक्स', 'आतडे', 'यकृत',
    'रातांधळेपणा',
]


def detect_subject(question_text, opt_a='', opt_b='', opt_c='', opt_d=''):
    """Detect subject based on keywords in question and options."""
    full_text = f"{question_text} {opt_a} {opt_b} {opt_c} {opt_d}".lower()
    
    scores = {
        'math': 0,
        'marathi': 0,
        'reasoning': 0,
        'gk': 0,
        'science': 0,
    }
    
    for kw in MATH_KEYWORDS:
        if kw.lower() in full_text:
            scores['math'] += 1
    
    for kw in MARATHI_KEYWORDS:
        if kw.lower() in full_text:
            scores['marathi'] += 1
    
    for kw in REASONING_KEYWORDS:
        if kw.lower() in full_text:
            scores['reasoning'] += 1
    
    for kw in GK_KEYWORDS:
        if kw.lower() in full_text:
            scores['gk'] += 1
    
    for kw in SCIENCE_KEYWORDS:
        if kw.lower() in full_text:
            scores['science'] += 1
    
    # Get the subject with highest score
    max_score = max(scores.values())
    if max_score == 0:
        return 'gk'  # default to GK if no keywords match
    
    # Return subject with highest score
    return max(scores, key=scores.get)


# Instruction keywords to filter out
INSTRUCTION_KEYWORDS = [
    'प्रश्नपत्रिकेत', 'प्रश्‍नपत्रिकेत', 'उत्तरपत्रिकेवर', 'उत्तरपत्निकेवर',
    'परीक्षेमध्ये', 'निषिध्द', 'नियमांचे', 'सुचनांचे', 'प्रवेशपत्रात',
    'पाने प्रश्‍नांकरीता', 'खाणाखुणा करु नये', 'योग्य पर्याय निवडून',
    'काळया शाईचे', 'बॉलपेन', 'खादयाखोड', 'सर्व प्रश्‍न बहुपर्यायी',
    'उत्तरपत्रिव्हेत', 'उत्तरपत्रिव्हेवर', 'संचाचा', 'प्रश्‍नपत्रिकेवर',
    'कच्ये काम', 'कच्चे काम', 'साधनांचा वापर',
    'प्रश्नपत्रिकेवर', 'काळया शाईच्या',
]


def clean_text(text):
    """Basic cleaning of OCR-garbled text."""
    if not text:
        return ''
    # Remove leading/trailing whitespace
    text = text.strip()
    # Remove OCR artifacts like *, &, |, etc at start
    text = re.sub(r'^[*&|०)९)८)७)\s]+', '', text)
    # Remove trailing artifacts
    text = re.sub(r'[*&|]+$', '', text)
    return text.strip()


# =====================================================
# MAIN PROCESSING
# =====================================================

valid_rows = []
subject_counts = {'math': 0, 'marathi': 0, 'reasoning': 0, 'gk': 0, 'science': 0}

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    for row in reader:
        if len(row) < 7:
            continue
        
        q_text = row[2].strip()
        opt_a = row[3].strip() if len(row) > 3 else ''
        opt_b = row[4].strip() if len(row) > 4 else ''
        opt_c = row[5].strip() if len(row) > 5 else ''
        opt_d = row[6].strip() if len(row) > 6 else ''
        
        # Skip empty/short questions
        if len(q_text) < 10:
            continue
        
        # Skip instructions
        is_instruction = False
        for kw in INSTRUCTION_KEYWORDS:
            if kw in q_text:
                is_instruction = True
                break
        if is_instruction:
            continue
        
        # Must have all 4 options non-empty
        options = [opt_a, opt_b, opt_c, opt_d]
        non_empty = [o for o in options if len(o) >= 1]
        if len(non_empty) != 4:
            continue
        
        # Filter out merged/corrupted rows (option > 100 chars)
        if any(len(o) > 100 for o in options):
            continue
        
        # At least 3 options should be > 1 char
        good_opts = [o for o in options if len(o) >= 2]
        if len(good_opts) < 3:
            continue
        
        # Clean the text
        q_clean = clean_text(q_text)
        a_clean = clean_text(opt_a)
        b_clean = clean_text(opt_b)
        c_clean = clean_text(opt_c)
        d_clean = clean_text(opt_d)
        
        # Detect subject
        subject = detect_subject(q_clean, a_clean, b_clean, c_clean, d_clean)
        subject_counts[subject] += 1
        
        valid_rows.append({
            'question_marathi': q_clean,
            'option_a': a_clean,
            'option_b': b_clean,
            'option_c': c_clean,
            'option_d': d_clean,
            'subject': subject,
            'exam_type': 'police_bharti',
        })

# Write output CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'question_marathi', 'option_a', 'option_b', 'option_c', 'option_d',
        'subject', 'exam_type'
    ])
    writer.writeheader()
    writer.writerows(valid_rows)

# Print report
print("=" * 60)
print("CLEAN MCQ CSV GENERATION REPORT")
print("=" * 60)
print(f"Total clean MCQs written: {len(valid_rows)}")
print(f"Output file: {output_file}")
print()
print("Subject-wise breakdown:")
print("-" * 40)
for subject, count in sorted(subject_counts.items(), key=lambda x: -x[1]):
    print(f"  {subject}: {count}")
print()
print("Sample rows (first 5):")
print("-" * 60)
for i, row in enumerate(valid_rows[:5]):
    print(f"\n#{i+1} [{row['subject']}]")
    print(f"  Q: {row['question_marathi'][:80]}")
    print(f"  A: {row['option_a'][:40]}")
    print(f"  B: {row['option_b'][:40]}")
    print(f"  C: {row['option_c'][:40]}")
    print(f"  D: {row['option_d'][:40]}")

print(f"\n✅ Done! CSV saved to: {output_file}")
