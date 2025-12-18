const form = document.getElementById("dietForm");
const ageInput = document.getElementById("age");
const genderInput = document.getElementById("gender");
const weightInput = document.getElementById("weight");
const feetInput = document.getElementById("feet");
const inchesInput = document.getElementById("inches");
const activityLevelInput = document.getElementById("activityLevel");
const resultDiv = document.getElementById("dietResult");
const dietPlanContainer = document.getElementById("dietPlanContainer");

// 🔴 PASTE YOUR GEMINI API KEY HERE
const API_KEY = "AIzaSyATt_vklJArcTskeJpcPLvI6fNLjOk6eKA"; 

form.addEventListener("submit", async function(event) { // Added 'async' keyword
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
  const fat = (fatCalories / 9).toFixed(1); // 9 cal per gram for fat

  // Update Result Display
  document.getElementById("calorieGoal").textContent = "Calories: " + calories.toFixed(0) + " kcal";
  document.getElementById("proteinGoal").textContent = "Protein: " + protein + " g";
  document.getElementById("carbGoal").textContent = "Carbs: " + carbs + " g";
  
  // Create Fat element if it doesn't exist in HTML, or update if you added it
  const fatEl = document.getElementById("fatGoal");
  if(fatEl) fatEl.textContent = "Fat: " + fat + " g";

  // Show the results div
  resultDiv.style.display = "block";

  // Store metrics (keeping your original localStorage logic)
  localStorage.setItem("userMetrics", JSON.stringify({
    age, gender, weight, heightCm, bmi, bmr,
    dailyCalories: calories,
    dailyProtein: protein,
    dailyCarbs: carbs,
    dailyFat: fat,
    activityLevel
  }));

  // ==========================================
  // GEMINI API CALL STARTS HERE
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
 
const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
  
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      // Get the text and remove any ```html formatting if Gemini adds it
      let aiText = data.candidates[0].content.parts[0].text;
      aiText = aiText.replace(/```html/g, "").replace(/```/g, "");
      
      dietPlanContainer.innerHTML = aiText;
    } else {
      dietPlanContainer.innerHTML = "<p>Could not generate plan. Please try again.</p>";
    }
  } catch (error) {
    console.error("API Error:", error);
    dietPlanContainer.innerHTML = "<p>Error connecting to AI. Check your internet or API key.</p>";
  }
});