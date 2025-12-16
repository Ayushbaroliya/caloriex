import json
import re
import os

# 1. SETUP PATHS AUTOMATICALLY (Fixes FileNotFoundError)
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

# Load Data
try:
    with open(input_filename, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
except FileNotFoundError:
    print(f"ERROR: Could not find {input_filename}")
    print("Make sure the JSON file is in the SAME folder as this script!")
    exit()

cleaned_data = []
seen_base_names = set()

print("Processing data...")

for item in raw_data:
    clean_item = {clean_key(k): clean_value(v) for k, v in item.items()}
    
    full_name = clean_item.get('name', 'Unknown').strip()
    
    # 2. SMART DEDUPLICATION (Split by comma)
    # "Mango, ripe" -> "Mango"
    # "Rice, raw, brown" -> "Rice"
    base_name = full_name.split(',')[0].strip()
    
    # Skip if we already have this "Base Food"
    if base_name.lower() in seen_base_names:
        continue
    
    # 3. FILTER ZERO ENERGY
    energy_kj = clean_item.get('enerc', 0)
    if not isinstance(energy_kj, (int, float)) or energy_kj <= 0:
        continue

    # Convert to kcal
    calories_kcal = round(energy_kj / 4.184)
    
    # Double check calculated calories aren't zero (e.g. water)
    if calories_kcal <= 0:
        continue

    # Add to our list
    seen_base_names.add(base_name.lower())
    
    code = clean_item.get('code', 'UNKNOWN')
    
    api_object = {
        "_id": code,
        "name": base_name,  # storing the clean "Base Name"
        "original_name": full_name, # keeping original just in case
        "category": get_category(code),
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

print(f"Success! Created '{output_filename}'")
print(f"Total Unique Items: {len(cleaned_data)}")