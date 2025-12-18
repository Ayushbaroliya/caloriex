const form = document.getElementById("dietForm");
const ageInput = document.getElementById("age");
const genderInput = document.getElementById("gender");
const weightInput = document.getElementById("weight");
const feetInput = document.getElementById("feet");
const inchesInput = document.getElementById("inches");
const activityLevelInput = document.getElementById("activityLevel");
const resultDiv = document.getElementById("dietResult");

form.addEventListener("submit", function(event) {
  event.preventDefault();

  const age = parseInt(ageInput.value);
  const gender = genderInput.value;
  const weight = parseFloat(weightInput.value);
  const feet = parseFloat(feetInput.value);
  const inches = parseFloat(inchesInput.value) || 0;
  const activityLevel = activityLevelInput.value;

 
  const totalInches = feet * 12 + inches;
  const heightCm = totalInches * 2.54;

  const bmi = weight / (heightCm / 100) / (heightCm / 100);

  let bmr;
  if(gender === "male") {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age - 161;
  }

  let calories;
  if(activityLevel === "sedentary") {
    calories = bmr * 1.2;
  } else if(activityLevel === "lightlyActive") {
    calories = bmr * 1.375;
  } else if(activityLevel === "moderatelyActive") {
    calories = bmr * 1.55;
  } else if(activityLevel === "veryActive") {
    calories = bmr * 1.725;
  } else {
    calories = bmr * 1.9;
  }

  // Calculate macros (balanced diet: 40% carbs, 30% protein, 30% fat)
  const proteinCalories = calories * 0.30;
  const carbCalories = calories * 0.40;
  const protein = proteinCalories / 4; // 4 cal per gram
  const carbs = carbCalories / 4;      // 4 cal per gram

  // Update result display
  document.getElementById("calorieGoal").textContent = "Calories: " + calories.toFixed(0) + " kcal";
  document.getElementById("proteinGoal").textContent = "Protein: " + protein.toFixed(1) + " g";
  document.getElementById("carbGoal").textContent = "Carbs: " + carbs.toFixed(1) + " g";

  resultDiv.style.display = "block";
});