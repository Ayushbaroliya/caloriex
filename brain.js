const form = document.querySelector("#food-form");
const input = document.querySelector("#food");
const quantityInput = document.querySelector("#quantity");
const totalCaloriesEl = document.querySelector("#totalCalories");

const API_KEY = "c1QArOcc4SYlCqvg73ZsTG9Cu6nTc0MtOMazf4iv";

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const food = input.value.trim().toLowerCase();
  const quantity = Number(quantityInput.value);

  if (!food || !quantity) {
    totalCaloriesEl.textContent = "Invalid input";
    return;
  }

  const api =
    "https://api.nal.usda.gov/fdc/v1/foods/search?query=" +
    food +
    "&pageSize=1&api_key=" +
    API_KEY;

  try {
    const response = await fetch(api);
    const data = await response.json();

    if (!data.foods || data.foods.length === 0) {
      totalCaloriesEl.textContent = "Food not found";
      return;
    }

    const nutrients = data.foods[0].foodNutrients;

    const energyObj = nutrients.find(item =>
      item.nutrientName.includes("Energy")
    );

    if (!energyObj) {
      totalCaloriesEl.textContent = "Calories data unavailable";
      return;
    }

    const caloriesPer100g = energyObj.value;
    const totalCalories = (caloriesPer100g * quantity) / 100;

    
    totalCaloriesEl.textContent = `${totalCalories.toFixed(2)} kcal`;

  } catch (error) {
    totalCaloriesEl.textContent = "Error fetching data";
    console.error(error);
  }
});
