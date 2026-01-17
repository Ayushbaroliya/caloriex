const form = document.getElementById("bmiForm");

form.addEventListener("submit", (event) => {
    event.preventDefault();

    const weight = parseFloat(document.getElementById("weight").value);
    const feet = parseFloat(document.getElementById("feet").value);
    const inches = parseFloat(document.getElementById("inches").value) || 0;

    const totalInches = (feet * 12) + inches;
    const heightInMeters = totalInches * 0.0254;

    // Guard against division by zero
    if (heightInMeters === 0) return;

    const bmi = weight / (heightInMeters * heightInMeters);
    console.log("Calculated BMI:", bmi);

    // Store BMI metrics in localStorage for AI Chat
    localStorage.setItem("userMetrics", JSON.stringify({
        weight: weight,
        heightFeet: feet,
        heightInches: inches,
        bmi: bmi
    }));

    updateGauge(bmi);
});

function updateGauge(value) {
    const needle = document.getElementById("bmiNeedle");
    const valueText = document.getElementById("bmiValueText");
    const statusText = document.getElementById("bmiStatusText");

    if (!needle || !valueText || !statusText) return;

    valueText.innerText = value.toFixed(1);

    // Clamp value for gauge visual
    let clampedValue = value;
    if (clampedValue < 0) clampedValue = 0;
    if (clampedValue > 40) clampedValue = 40;

    // Calculate angle: 0 = -90deg, 40 = 90deg
    const angle = ((clampedValue / 40) * 180) - 90;
    needle.style.transform = `rotate(${angle}deg)`;

    if (value < 18.5) {
        statusText.innerText = "Underweight";
        statusText.style.color = "#3498db"; // Blue
    }
    else if (value >= 18.5 && value < 25) {
        statusText.innerText = "Healthy";
        statusText.style.color = "#2ecc71"; // Green
    }
    else if (value >= 25 && value < 30) {
        statusText.innerText = "Overweight";
        statusText.style.color = "#f1c40f"; // Yellow
    }
    else {
        statusText.innerText = "Obese";
        statusText.style.color = "#e74c3c"; // Red
    }
}