import json
import re
import os

def clean_and_modify_json(input_file, output_file):
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: The file '{input_file}' was not found in {os.getcwd()}")
        return

    try:
        # --- STEP 1: Read the raw file ---
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_data = f.read()
            
        print(f"Read {len(raw_data)} characters...")

        # --- STEP 2: Fix Syntax Errors (Regex) ---
        
        # FIX 1: The specific missing brace error between "Prawns" (S008) and "Poha"
        fixed_data = re.sub(
            r'("energy_kcal":\s*91\s*\}\s*)\n\s*,\s*\{\s*"name":\s*"Poha"', 
            r'\1\n    },\n    { "name": "Poha"', 
            raw_data
        )

        # FIX 2: Remove trailing commas before closing brackets
        fixed_data = re.sub(r',\s*([\]}])', r'\1', fixed_data)
        
        # --- STEP 3: Parse JSON ---
        try:
            data = json.loads(fixed_data)
            print("✅ JSON syntax fixed and parsed.")
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON: {e}")
            return

        # --- STEP 4: Remove the "_id" field ---
        ids_removed = 0
        for item in data:
            if "_id" in item:
                del item["_id"]
                ids_removed += 1
                
        print(f"ℹ️  Removed '_id' from {ids_removed} items.")

        # --- STEP 5: Save Final JSON ---
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        
        print(f"✅ Success! Saved to: {output_file}")

    except Exception as e:
        print(f"❌ An unexpected error occurred: {e}")

if __name__ == "__main__":
    # Ensure this matches your actual JSON filename
    input_filename = 'indian_food_unique_clean.json'
    output_filename = 'indian_food_final.json'
    
    clean_and_modify_json(input_filename, output_filename)