const form = document.querySelector("#food-form");
const foodInput = document.querySelector("#food");
const quantityInput = document.querySelector("#quantity");
const toggle = document.querySelector("#foodToggle");
const rawLabel = document.querySelector("#rawLabel");
const cookedLabel = document.querySelector("#cookedLabel");

const resultCard = document.querySelector("#result-card");
const resFoodName = document.querySelector("#resFoodName");
const resCategory = document.querySelector("#resCategory");
const resCalories = document.querySelector("#resCalories");
const resProtein = document.querySelector("#resProtein");
const resCarbs = document.querySelector("#resCarbs");
const resSource = document.querySelector("#resSource");

// Backend URL
const BACKEND_URL = "http://localhost:5000";

let selectedType = "raw";
let indianFoods = [];

// 1. Load Data
fetch("data/indian_food_unique_clean.json")
  .then(res => res.json())
  .then(data => {
    indianFoods = data;
    console.log("✅ DB Loaded:", indianFoods.length);
  })
  .catch(err => console.error("❌ Load Error:", err));

// 2. Toggle Switch Logic
toggle.addEventListener("change", () => {
  if (toggle.checked) {
    selectedType = "cooked";
    cookedLabel.classList.add("active-label");
    rawLabel.classList.remove("active-label");
  } else {
    selectedType = "raw";
    rawLabel.classList.add("active-label");
    cookedLabel.classList.remove("active-label");
  }
});

// 3. Search Logic
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const food = foodInput.value.trim().toLowerCase();
  const quantity = Number(quantityInput.value);

  if (!food || !quantity) return;

  // First check local database
  const foundFood = indianFoods.find(item => {
    const itemName = (item.name || "").toLowerCase();
    const itemState = (item.state || "").toLowerCase();
    
    return itemName.includes(food) && itemState.includes(selectedType);
  });

  if (foundFood) {
    displayResult(foundFood, quantity, "IFCT 2017 (India)");
  } else {
    // If not found locally, query backend USDA API
    resSource.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching from USDA...';
    resultCard.classList.remove("hidden");
    await fetchFromUSDA(food, quantity);
  }
});

function displayResult(item, quantity, source) {
  resultCard.classList.remove("hidden");

  const multiplier = quantity / 100;
  
  resFoodName.textContent = item.name || item.description || "Unknown Food";
  resCategory.textContent = item.category || "General";
  resSource.textContent = `Source: ${source}`;

  const nutrients = item.nutrients || {};
  const cal = (nutrients.energy_kcal || 0) * multiplier;
  const prot = (nutrients.protein_g || 0) * multiplier;
  const carb = (nutrients.carbohydrate_g || 0) * multiplier;

  resCalories.textContent = `${cal.toFixed(0)} kcal`;
  resProtein.textContent = `${prot.toFixed(1)}g`;
  resCarbs.textContent = `${carb.toFixed(1)}g`;
}

async function fetchFromUSDA(query, quantity) {
  const searchTerm = selectedType === "cooked" ? `${query} cooked` : query;
  
  try {
    // Call backend proxy
    const response = await fetch(
      `${BACKEND_URL}/api/search-food?query=${encodeURIComponent(searchTerm)}&pageSize=1`
    );

    const data = await response.json();

    if (!response.ok || !data.foods || data.foods.length === 0) {
      resSource.textContent = "Food not found in any database.";
      resCalories.textContent = "0";
      resProtein.textContent = "0g";
      resCarbs.textContent = "0g";
      resFoodName.textContent = "Not Found";
      return;
    }

    const foodItem = data.foods[0];
    const getNutrient = (id) => {
      const n = foodItem.foodNutrients.find(x => x.nutrientId === id);
      return n ? n.value : 0;
    };

    const standardizedItem = {
      name: foodItem.description,
      category: foodItem.foodCategory || "Imported",
      nutrients: {
        energy_kcal: getNutrient(1008),   // Energy (kcal)
        protein_g: getNutrient(1003),     // Protein
        carbohydrate_g: getNutrient(1005) // Carbs
      }
    };

    displayResult(standardizedItem, quantity, "USDA Database");

  } catch (err) {
    console.error("Error:", err);
    resSource.textContent = "Error fetching data. Is backend running?";
  }
}