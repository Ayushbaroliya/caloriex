import json
import re

with open("ifct2017_compositions.json", encoding="utf-8") as f:
    raw_data = json.load(f)

clean_db = {}

for item in raw_data:
    name = item.get("Food Name", "").lower()

    # decide raw / cooked
    state = "cooked"
    if "raw" in name or "dry" in name:
        state = "raw"

    # normalize food name
    food_key = re.sub(r",.*", "", name).strip()

    try:
        calories = float(item.get("Energy (kcal)", 0))
    except:
        calories = 0

    if food_key not in clean_db:
        clean_db[food_key] = {}

    clean_db[food_key][state] = {
        "calories": calories,
        "protein": float(item.get("Protein (g)", 0) or 0),
        "carbs": float(item.get("Carbohydrate (g)", 0) or 0),
        "fat": float(item.get("Fat (g)", 0) or 0),
        "source": "IFCT"
    }

with open("indian_foods_clean.json", "w", encoding="utf-8") as f:
    json.dump(clean_db, f, indent=2)

print("Clean IFCT JSON created!")
