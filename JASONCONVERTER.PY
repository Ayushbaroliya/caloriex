import csv
import json

# Replace 'input_file.csv' with the actual filename you downloaded
csv_file_path = 'ifct2017_compositions.csv'
json_file_path = 'ifct2017_compositions.json'

data = []

# Read the CSV and add data to a list
with open(csv_file_path, encoding='utf-8') as csv_file:
    csv_reader = csv.DictReader(csv_file)
    for row in csv_reader:
        data.append(row)

# Write the list to a JSON file
with open(json_file_path, 'w', encoding='utf-8') as json_file:
    json.dump(data, json_file, indent=4)

print("Conversion complete!")