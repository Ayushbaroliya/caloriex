import json
import re

input_filename = 'ifct2017_compositions.json'
output_filename = 'indian_food_100_simplified.json'

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
    if any(x in lower_name for x in ['boiled', 'cooked', 'roasted', 'fried', 'baked']):
        return 'Cooked'
    return 'Raw'

# Load Data
with open(input_filename, 'r', encoding='utf-8') as f:
    raw_data = json.load(f)

cleaned_data = []
categories_count = {}

for item in raw_data:
    # Clean item keys and values
    clean_item = {clean_key(k): clean_value(v) for k, v in item.items()}
    
    code = clean_item.get('code', 'UNKNOWN')
    category = get_category(code)
    
    # Select distinct items (limit 8 per category to reach ~100 diverse items)
    if categories_count.get(category, 0) >= 8:
        continue
    categories_count[category] = categories_count.get(category, 0) + 1
    
    # Calculate Calories (Dataset is in kJ, converting to kcal)
    energy_kj = clean_item.get('enerc', 0)
    calories_kcal = round(energy_kj / 4.184) if energy_kj else 0

    # Build Simplified Object
    api_object = {
        "_id": code,
        "name": clean_item.get('name'),
        "category": category,
        "state": determine_state(clean_item.get('name', '')),
        "nutrients": {
            "protein_g": clean_item.get('protcnt', 0),
            "carbohydrate_g": clean_item.get('choavldf', 0),
            "energy_kcal": calories_kcal
        }
    }
    
    cleaned_data.append(api_object)
    
    if len(cleaned_data) >= 100:
        break

# Save File
with open(output_filename, 'w', encoding='utf-8') as f:
    json.dump(cleaned_data, f, indent=2)

print(f"Done! Created {output_filename} with {len(cleaned_data)} items.")