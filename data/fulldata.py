import json
import re
import os

# 1. SETUP PATHS AUTOMATICALLY
script_dir = os.path.dirname(os.path.abspath(__file__))
input_filename = os.path.join(script_dir, 'ifct2017_compositions.json')
output_filename = os.path.join(script_dir, 'indian_food_unique_clean.json')

def clean_key(key):
    return key.strip().replace('\ufeff', '')

def clean_value(value):
    if isinstance(value, str):
        value = value.strip()
        if re.match(r'^-?\d+(?:\.\d+)?$', value):
            try:
                return float(value) if '.' in value else int(value)
            except ValueError:
                return value
    return value

def get_category(code):
    prefix = code[0].upper()
    categories = {
        'A': 'Cereals', 'B': 'Pulses', 'C': 'Leafy Veg', 'D': 'Other Veg',
        'E': 'Fruits', 'F': 'Roots', 'G': 'Spices', 'H': 'Nuts',
        'I': 'Sugars', 'J': 'Mushrooms', 'M': 'Meat', 'O': 'Meat',
        'P': 'Fish', 'S': 'Seafood', 'T': 'Fats'
    }
    return categories.get(prefix, 'Other')

def determine_state(name):
    lower_name = name.lower()
    if any(x in lower_name for x in ['boiled', 'cooked', 'roasted', 'fried', 'baked', 'parboiled']):
        return 'Cooked'
    return 'Raw'

# Load Data
try:
    with open(input_filename, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
except FileNotFoundError:
    print(f"ERROR: Could not find {input_filename}")
    exit()

cleaned_data = []
seen_base_names = set()

print("Processing data...")

for item in raw_data:
    clean_item = {clean_key(k): clean_value(v) for k, v in item.items()}
    
    full_name = clean_item.get('name', 'Unknown').strip()
    
    # 2. SMART DEDUPLICATION
    base_name = full_name.split(',')[0].strip()
    
    if base_name.lower() in seen_base_names:
        continue
    
    # 3. FILTER ZERO ENERGY
    energy_kj = clean_item.get('enerc', 0)
    if not isinstance(energy_kj, (int, float)) or energy_kj <= 0:
        continue

    calories_kcal = round(energy_kj / 4.184)
    if calories_kcal <= 0:
        continue

    seen_base_names.add(base_name.lower())
    code = clean_item.get('code', 'UNKNOWN')
    
    # --- BUILDING THE OBJECT ---
    api_object = {
        "_id": code,
        "name": base_name,
        "original_name": full_name,
        "category": get_category(code),
        "state": determine_state(full_name),  # <--- I ADDED THIS BACK!
        "nutrients": {
            "protein_g": clean_item.get('protcnt', 0),
            "carbohydrate_g": clean_item.get('choavldf', 0),
            "energy_kcal": calories_kcal
        }
    }
    
    cleaned_data.append(api_object)

# Save File
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(cleaned_data, f, indent=2)

print(f"Success! Created '{output_filename}' with {len(cleaned_data)} items.")