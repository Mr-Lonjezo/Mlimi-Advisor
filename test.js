// Simple test to verify JavaScript is working
console.log("🧪 Testing JavaScript Basics...");

// Test variables
const farmerName = "Chikondi";
let cropChoice = "Maize";

console.log(`👩‍🌾 Farmer: ${farmerName}`);
console.log(`🌱 Crop: ${cropChoice}`);

// Test array
const districts = ["Kasungu", "Lilongwe", "Mzuzu"];
console.log(`📍 Districts: ${districts.join(", ")}`);

// Test function
function calculateProfit(price, quantity) {
    return price * quantity;
}

const profit = calculateProfit(250, 100);
console.log(`💰 Estimated profit: MWK ${profit}`);

console.log("✅ JavaScript test completed!");