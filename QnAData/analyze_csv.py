import csv
import re

csv_file = r"c:\Users\Mr.Comp\Desktop\Coding\MH_Bharti AI\QnAData\all_police_papers_data.csv"

total_rows = 0
valid_mcq = 0
invalid_rows = []
valid_rows = []

# Instruction keywords - rows with these are not real questions
instruction_keywords = [
    'प्रश्नपत्रिकेत', 'प्रश्‍नपत्रिकेत', 'उत्तरपत्रिकेवर', 'उत्तरपत्निकेवर',
    'परीक्षेमध्ये', 'निषिध्द', 'नियमांचे', 'सुचनांचे', 'प्रवेशपत्रात',
    'पाने प्रश्‍नांकरीता', 'खाणाखुणा करु नये', 'योग्य पर्याय निवडून',
    'काळया शाईचे', 'बॉलपेन', 'खादयाखोड', 'सर्व प्रश्‍न बहुपर्यायी',
    'उत्तरपत्रिव्हेत', 'उत्तरपत्रिव्हेवर', 'संचाचा', 'प्रश्‍नपत्रिकेवर',
    'कच्ये काम', 'कच्चे काम', 'साधनांचा वापर'
]

with open(csv_file, 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    header = next(reader)
    
    for row in reader:
        total_rows += 1
        
        if len(row) < 7:
            continue
        
        paper = row[0].strip()
        q_num = row[1].strip()
        q_text = row[2].strip()
        opt_a = row[3].strip() if len(row) > 3 else ''
        opt_b = row[4].strip() if len(row) > 4 else ''
        opt_c = row[5].strip() if len(row) > 5 else ''
        opt_d = row[6].strip() if len(row) > 6 else ''
        
        # Skip if question text is empty or too short
        if len(q_text) < 10:
            continue
        
        # Skip instructions
        is_instruction = False
        for kw in instruction_keywords:
            if kw in q_text:
                is_instruction = True
                break
        if is_instruction:
            continue
        
        # Check if all 4 options are non-empty and have reasonable length
        options = [opt_a, opt_b, opt_c, opt_d]
        non_empty_options = [o for o in options if len(o) >= 1]
        
        if len(non_empty_options) == 4:
            # Additional check: question text should end with ? or be a meaningful question
            # Also check that options don't contain another full question (merged data)
            # Check option quality - at least 3 options should be > 1 char
            good_options = [o for o in options if len(o) >= 2]
            if len(good_options) >= 3:
                valid_mcq += 1
                valid_rows.append({
                    'paper': paper,
                    'q_num': q_num,
                    'question': q_text,
                    'opt_a': opt_a,
                    'opt_b': opt_b,
                    'opt_c': opt_c,
                    'opt_d': opt_d,
                })

print("=" * 60)
print("CSV ANALYSIS REPORT")
print("=" * 60)
print(f"Total rows (excluding header): {total_rows}")
print(f"Valid MCQ questions (4 non-empty options): {valid_mcq}")
print(f"Invalid/non-MCQ rows: {total_rows - valid_mcq}")
print()

# Count by paper
paper_counts = {}
for v in valid_rows:
    p = v['paper']
    paper_counts[p] = paper_counts.get(p, 0) + 1

print("Valid MCQs per paper:")
print("-" * 40)
for paper, count in sorted(paper_counts.items()):
    print(f"  {paper}: {count}")

print()
print("=" * 60)
print("SAMPLE VALID MCQs (first 5):")
print("=" * 60)
for i, v in enumerate(valid_rows[:5]):
    print(f"\n--- MCQ #{i+1} ---")
    print(f"Paper: {v['paper']}")
    print(f"Q: {v['question'][:100]}...")
    print(f"A: {v['opt_a'][:50]}")
    print(f"B: {v['opt_b'][:50]}")
    print(f"C: {v['opt_c'][:50]}")
    print(f"D: {v['opt_d'][:50]}")

# Also check: how many rows have question text that contains "?" (likely a real question)
q_mark_count = 0
for v in valid_rows:
    if '?' in v['question'] or '१' in v['question']:
        q_mark_count += 1
print(f"\nValid MCQs with '?' in question text: {q_mark_count}")

# Check for potential issues - options that contain another question (merged data)
merged_count = 0
for v in valid_rows:
    for opt in [v['opt_a'], v['opt_b'], v['opt_c'], v['opt_d']]:
        if len(opt) > 100:
            merged_count += 1
            break
            
print(f"Valid MCQs where at least one option is >100 chars (possible merged data): {merged_count}")
print(f"Clean valid MCQs (options all <100 chars): {valid_mcq - merged_count}")
