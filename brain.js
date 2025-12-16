const form = document.querySelector("#food-form");
const foodInput = document.querySelector("#food");
const quantityInput = document.querySelector("#quantity");
const totalCaloriesEl = document.querySelector("#totalCalories");

const toggle = document.querySelector("#foodToggle");
const rawLabel = document.querySelector("#rawLabel");
const cookedLabel = document.querySelector("#cookedLabel");

let selectedType = "raw";

const API_KEY = "c1QArOcc4SYlCqvg73ZsTG9Cu6nTc0MtOMazf4iv";

/* TOGGLE */
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

/* FORM */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const food = foodInput.value.trim().toLowerCase();
  const quantity = Number(quantityInput.value);

  if (!food || !quantity) {
    totalCaloriesEl.textContent = "Invalid input";
    return;
  }

  // 🔥 IMPORTANT FIX: raw/cooked added to query
  const api = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${food} ${selectedType}&pageSize=10&api_key=${API_KEY}`;

  try {
    const res = await fetch(api);
    const data = await res.json();

    if (!data.foods || data.foods.length === 0) {
      totalCaloriesEl.textContent = "Food not found";
      return;
    }

    // Select best matching food
    let selectedFood = data.foods.find(item =>
      item.description.toLowerCase().includes(selectedType) &&
      !item.description.toLowerCase().includes("canned") &&
      !item.description.toLowerCase().includes("jar") &&
      !item.description.toLowerCase().includes("powder") &&
      !item.description.toLowerCase().includes("dehydrated")&&
      !item.description.toLowerCase().includes("dried")&&
      !item.description.toLowerCase().includes("Wild")&&
      !item.description.toLowerCase().includes("wild")&&
      (item.dataType === "SR Legacy" || item.dataType === "Foundation")
    );

    if (!selectedFood) selectedFood = data.foods[0];

    const energy = selectedFood.foodNutrients.find(n =>
      n.nutrientName.includes("Energy")
    );

    if (!energy) {
      totalCaloriesEl.textContent = "Calories unavailable";
      return;
    }

    const calories = (energy.value * quantity) / 100;

    totalCaloriesEl.innerHTML = `
      ${calories.toFixed(2)} kcal
      <br>
      <small>Using: ${selectedFood.description}</small>
    `;

  } catch (err) {
    totalCaloriesEl.textContent = "Error fetching data";
    console.error(err);
  }
});
