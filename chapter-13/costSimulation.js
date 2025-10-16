// costSimulation.js
// Simulate 1,000 users' AI feature usage and estimate revenue vs. cost

const NUM_USERS = 1000;

// Pricing and cost assumptions (in USD)
const PRICE_PER_USER_MONTH = 10.0; // subscription price
const COST_PER_1K_TOKENS = 0.01; // GPT-5 output token cost
const AVG_TOKENS_PER_REQUEST = 500; // avg. completion length
const AVG_REQUESTS_PER_USER = 120; // avg. requests per month

// Generate random usage variations (±20%)
function randomize(value) {
  const variance = 0.2 * value;
  return value + (Math.random() * 2 - 1) * variance;
}

function simulate() {
  let totalRevenue = 0;
  let totalCost = 0;

  for (let i = 0; i < NUM_USERS; i++) {
    const requests = randomize(AVG_REQUESTS_PER_USER);
    const tokens = requests * randomize(AVG_TOKENS_PER_REQUEST);

    const cost = (tokens / 1000) * COST_PER_1K_TOKENS;
    totalCost += cost;

    // assume each user pays a fixed subscription
    totalRevenue += PRICE_PER_USER_MONTH;
  }

  const profit = totalRevenue - totalCost;
  const margin = ((profit / totalRevenue) * 100).toFixed(2);

  console.log(`Simulated ${NUM_USERS.toLocaleString()} users`);
  console.log(`Total revenue: $${totalRevenue.toFixed(2)}`);
  console.log(`Total cost:    $${totalCost.toFixed(2)}`);
  console.log(`Profit:        $${profit.toFixed(2)} (${margin}% margin)`);
}

simulate();
