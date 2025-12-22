const form = document.getElementById("dietForm");
const ageInput = document.getElementById("age");
const genderInput = document.getElementById("gender");
const weightInput = document.getElementById("weight");
const feetInput = document.getElementById("feet");
const inchesInput = document.getElementById("inches");
const activityLevelInput = document.getElementById("activityLevel");
const resultDiv = document.getElementById("dietResult");
const dietPlanContainer = document.getElementById("dietPlanContainer");

// Backend URL - Change this to your server URL (localhost:5000 for development, your domain for production)
const BACKEND_URL = "http://localhost:5000";

form.addEventListener("submit", async function(event) {
  event.preventDefault();

  const age = parseInt(ageInput.value) || 0;
  const gender = genderInput.value;
  const weight = parseFloat(weightInput.value) || 0;
  const feet = parseFloat(feetInput.value) || 0;
  const inches = parseFloat(inchesInput.value) || 0;
  const activityLevel = activityLevelInput.value;

  const totalInches = feet * 12 + inches;
  const heightCm = totalInches * 2.54;

  // Calculate BMI
  const bmi = (weight / (heightCm / 100) / (heightCm / 100)).toFixed(1);

  // Calculate BMR (Mifflin-St Jeor Equation)
  let bmr;
  if(gender === "male") {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * heightCm - 5 * age - 161;
  }

  // Calculate Total Calories based on Activity
  let calories;
  if(activityLevel === "sedentary") calories = bmr * 1.2;
  else if(activityLevel === "lightlyActive") calories = bmr * 1.375;
  else if(activityLevel === "moderatelyActive") calories = bmr * 1.55;
  else if(activityLevel === "veryActive") calories = bmr * 1.725;
  else calories = bmr * 1.9;

  // Calculate Macros (40% Carbs, 30% Protein, 30% Fat)
  const proteinCalories = calories * 0.30;
  const carbCalories = calories * 0.40;
  const fatCalories = calories * 0.30;

  const protein = (proteinCalories / 4).toFixed(1);
  const carbs = (carbCalories / 4).toFixed(1);
  const fat = (fatCalories / 9).toFixed(1);

  // Update Result Display
  document.getElementById("calorieGoal").textContent = "Calories: " + calories.toFixed(0) + " kcal";
  document.getElementById("proteinGoal").textContent = "Protein: " + protein + " g";
  document.getElementById("carbGoal").textContent = "Carbs: " + carbs + " g";
  
  const fatEl = document.getElementById("fatGoal");
  if(fatEl) fatEl.textContent = "Fat: " + fat + " g";

  // Show the results div
  resultDiv.style.display = "block";

  // Store metrics
  localStorage.setItem("userMetrics", JSON.stringify({
    age, gender, weight, heightCm, bmi, bmr,
    dailyCalories: calories,
    dailyProtein: protein,
    dailyCarbs: carbs,
    dailyFat: fat,
    activityLevel,
    heightFeet: feet,
    heightInches: inches
  }));

  // ==========================================
  // CALL BACKEND PROXY
  // ==========================================
  dietPlanContainer.innerHTML = "<p><i>Generating your personalized meal plan...</i></p>";

  const prompt = `
    I am a ${age} year old ${gender}. Height: ${feet}ft ${inches}in, Weight: ${weight}kg.
    My BMI is ${bmi}. Activity Level: ${activityLevel}.
    My daily target is ${calories.toFixed(0)} calories.
    Macros: ${protein}g Protein, ${carbs}g Carbs, ${fat}g Fat.
    
    Create a strict one-day meal plan (Breakfast, Lunch, Snack, Dinner) that fits these numbers. 
    Format the output as clean HTML (use <ul> and <strong> tags). Do not include markdown ticks.
  `;

  try {
    const response = await fetch(`${BACKEND_URL}/api/generate-meal-plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: prompt })
    });

    const data = await response.json();
    
    if (!response.ok) {
      dietPlanContainer.innerHTML = `<p>Error: ${data.error || 'Failed to generate plan'}</p>`;
      return;
    }

    if (data.candidates && data.candidates.length > 0) {
      let aiText = data.candidates[0].content.parts[0].text;
      aiText = aiText.replace(/```html/g, "").replace(/```/g, "");
      
      dietPlanContainer.innerHTML = aiText;
    } else {
      dietPlanContainer.innerHTML = "<p>Could not generate plan. Please try again.</p>";
    }
  } catch (error) {
    console.error("API Error:", error);
    dietPlanContainer.innerHTML = "<p>Error connecting to server. Check if backend is running on " + BACKEND_URL + "</p>";
  }
});