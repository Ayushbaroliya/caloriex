const form = document.querySelector("#food-form");
const foodInput = document.querySelector("#food");
const quantityInput = document.querySelector("#quantity");
const totalCaloriesEl = document.querySelector("#totalCalories");

const toggle = document.querySelector("#foodToggle");
const rawLabel = document.querySelector("#rawLabel");
const cookedLabel = document.querySelector("#cookedLabel");

let selectedType = "raw";
let indianFoods = [];

const USDA_KEY = "c1QArOcc4SYlCqvg73ZsTG9Cu6nTc0MtOMazf4iv";


fetch("data/indian_food_unique_clean.json")
  .then(res => res.json())
  .then(data => {
    indianFoods = data;
    console.log("✅ IFCT DB loaded:", indianFoods.length);
  })
  .catch(err => console.error("❌ IFCT load error", err));


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

function findIndianFood(name, state) {
  return indianFoods.find(item =>
    item.name.toLowerCase().includes(name) &&
    item.state.toLowerCase() === state
  );
}


form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const food = foodInput.value.trim().toLowerCase();
  const quantity = Number(quantityInput.value);

  if (!food || !quantity) {
    totalCaloriesEl.textContent = "Invalid input";
    return;
  }

  const indianFood = findIndianFood(food, selectedType);

  if (indianFood) {
    const caloriesPer100g = indianFood.nutrients.energy_kcal;
    const totalCalories = (caloriesPer100g * quantity) / 100;

    totalCaloriesEl.innerHTML = `
      ${totalCalories.toFixed(2)} kcal
      <br>
      <small>Source: IFCT (India)</small>
    `;
    return;
  }

  totalCaloriesEl.textContent = "Fetching from USDA...";

  fetchFromUSDA(food, quantity);
});


async function fetchFromUSDA(food, quantity) {
  const api = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${food} cooked&pageSize=5&api_key=${USDA_KEY}`;

  try {
    const res = await fetch(api);
    const data = await res.json();

    if (!data.foods || data.foods.length === 0) {
      totalCaloriesEl.textContent = "Food not found";
      return;
    }

    const nutrients = data.foods[0].foodNutrients;
    const energy = nutrients.find(n => n.nutrientName.includes("Energy"));

    if (!energy) {
      totalCaloriesEl.textContent = "Calories unavailable";
      return;
    }

    const totalCalories = (energy.value * quantity) / 100;

    totalCaloriesEl.innerHTML = `
      ${totalCalories.toFixed(2)} kcal
      <br>
      <small>Source: USDA (fallback)</small>
    `;

  } catch (err) {
    totalCaloriesEl.textContent = "Error fetching USDA data";
    console.error(err);
  }
}
