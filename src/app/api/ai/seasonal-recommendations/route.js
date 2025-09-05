import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().getMonth() + 1;
    const location = searchParams.get("location") || "India";
    const type = searchParams.get("type") || "vegetables"; // vegetables, planting, harvesting

    console.log("🌱 AI Seasonal Recommendations:", { month, location, type });

    // Indian seasonal calendar data
    const seasonalData = {
      vegetables: {
        1: {
          // January
          season: "Winter",
          best_vegetables: [
            { name: "Cauliflower", reason: "Peak season, sweet and tender" },
            { name: "Cabbage", reason: "Fresh and crisp in winter" },
            { name: "Carrot", reason: "Sweet winter harvest" },
            { name: "Radish", reason: "Crisp and peppery" },
            { name: "Spinach", reason: "Nutrient-rich winter green" },
            { name: "Peas", reason: "Sweet winter pods" },
            { name: "Turnip", reason: "Fresh winter root vegetable" },
            { name: "Mustard Greens", reason: "Perfect for winter dishes" },
          ],
          avoid: ["Cucumber", "Bottle Gourd", "Ridge Gourd"],
          tips: "Winter vegetables are at their peak. Focus on leafy greens and root vegetables.",
        },
        2: {
          // February
          season: "Late Winter",
          best_vegetables: [
            { name: "Broccoli", reason: "Cool weather favorite" },
            { name: "Lettuce", reason: "Crisp and fresh" },
            { name: "Beetroot", reason: "Sweet winter harvest" },
            { name: "Onion", reason: "Storage onions available" },
            { name: "Garlic", reason: "Fresh winter bulbs" },
            { name: "Coriander", reason: "Aromatic winter herb" },
            { name: "Fenugreek", reason: "Bitter winter green" },
          ],
          avoid: ["Okra", "Eggplant", "Tomato"],
          tips: "Last month for winter vegetables. Start planning for summer crops.",
        },
        3: {
          // March
          season: "Spring Transition",
          best_vegetables: [
            { name: "Potato", reason: "Fresh spring harvest" },
            { name: "Sweet Potato", reason: "End of storage season" },
            { name: "Spring Onion", reason: "Fresh and mild" },
            { name: "Mint", reason: "Fresh spring herb" },
            { name: "Cilantro", reason: "Before it bolts in heat" },
            { name: "Capsicum", reason: "Early spring harvest" },
          ],
          avoid: ["Heavy gourds", "Summer squash"],
          tips: "Transition month. Mix of winter and early summer vegetables available.",
        },
        4: {
          // April
          season: "Early Summer",
          best_vegetables: [
            { name: "Tomato", reason: "Spring harvest begins" },
            { name: "Eggplant", reason: "Early summer variety" },
            { name: "Chili", reason: "Hot weather crop starts" },
            { name: "Okra", reason: "Heat-loving vegetable" },
            { name: "Cucumber", reason: "Cooling summer vegetable" },
            { name: "Bottle Gourd", reason: "Summer hydration" },
          ],
          avoid: ["Cauliflower", "Cabbage", "Winter greens"],
          tips: "Summer vegetables start appearing. Focus on heat-tolerant crops.",
        },
        5: {
          // May
          season: "Peak Summer",
          best_vegetables: [
            { name: "Mango", reason: "Peak mango season" },
            { name: "Watermelon", reason: "Summer hydration fruit" },
            { name: "Muskmelon", reason: "Cooling summer fruit" },
            { name: "Ridge Gourd", reason: "Summer climbing vegetable" },
            { name: "Snake Gourd", reason: "Heat-resistant gourd" },
            { name: "Bitter Gourd", reason: "Summer detox vegetable" },
          ],
          avoid: ["Leafy greens", "Cool season crops"],
          tips: "Peak summer. Focus on gourds and heat-resistant vegetables.",
        },
        6: {
          // June
          season: "Pre-Monsoon",
          best_vegetables: [
            { name: "Green Beans", reason: "Monsoon preparation crop" },
            { name: "Drumstick", reason: "Monsoon tree vegetable" },
            { name: "Plantain", reason: "Year-round availability" },
            { name: "Ginger", reason: "Fresh monsoon spice" },
            { name: "Turmeric", reason: "Fresh rhizome season" },
          ],
          avoid: ["Stored winter vegetables"],
          tips: "Pre-monsoon period. Prepare for monsoon vegetables.",
        },
        7: {
          // July
          season: "Monsoon",
          best_vegetables: [
            { name: "Corn", reason: "Fresh monsoon harvest" },
            { name: "Green Leafy Vegetables", reason: "Monsoon growth spurt" },
            { name: "Amaranth", reason: "Monsoon green" },
            { name: "Water Spinach", reason: "Loves wet conditions" },
            { name: "Taro", reason: "Monsoon root vegetable" },
          ],
          avoid: ["Stored vegetables", "Dried produce"],
          tips: "Monsoon season. Fresh greens and rain-fed crops available.",
        },
        8: {
          // August
          season: "Peak Monsoon",
          best_vegetables: [
            { name: "Pointed Gourd", reason: "Monsoon climbing vegetable" },
            { name: "Ivy Gourd", reason: "Monsoon small gourd" },
            { name: "Cluster Beans", reason: "Monsoon legume" },
            { name: "Yam", reason: "Monsoon tuber" },
            { name: "Colocasia", reason: "Wet season root" },
          ],
          avoid: ["Sun-dried vegetables"],
          tips: "Peak monsoon. Root vegetables and gourds thrive.",
        },
        9: {
          // September
          season: "Post-Monsoon",
          best_vegetables: [
            { name: "Pumpkin", reason: "Post-monsoon harvest" },
            { name: "Sweet Corn", reason: "Late monsoon crop" },
            { name: "Papaya", reason: "Year-round tropical fruit" },
            { name: "Banana", reason: "Post-monsoon harvest" },
            { name: "Coconut", reason: "Fresh tender coconut" },
          ],
          avoid: ["Winter vegetables not yet ready"],
          tips: "Post-monsoon transition. Prepare for winter vegetable season.",
        },
        10: {
          // October
          season: "Early Winter",
          best_vegetables: [
            { name: "Tomato", reason: "Winter variety starts" },
            { name: "Capsicum", reason: "Cool weather crop" },
            { name: "French Beans", reason: "Cool season legume" },
            { name: "Carrot", reason: "Early winter harvest" },
            { name: "Radish", reason: "Cool weather root" },
            { name: "Turnip", reason: "Winter root vegetable" },
          ],
          avoid: ["Summer gourds", "Heat-loving crops"],
          tips: "Winter vegetables start appearing. Transition from monsoon to winter crops.",
        },
        11: {
          // November
          season: "Winter",
          best_vegetables: [
            { name: "Cauliflower", reason: "Early winter harvest" },
            { name: "Cabbage", reason: "Cool weather brassica" },
            { name: "Spinach", reason: "Winter leafy green" },
            { name: "Peas", reason: "Cool season legume" },
            { name: "Mustard Greens", reason: "Winter green" },
            { name: "Fenugreek", reason: "Cool weather herb" },
          ],
          avoid: ["Summer vegetables", "Monsoon crops"],
          tips: "Winter season begins. Focus on cool weather crops and leafy greens.",
        },
        12: {
          // December
          season: "Peak Winter",
          best_vegetables: [
            { name: "Broccoli", reason: "Peak winter vegetable" },
            { name: "Lettuce", reason: "Cool weather salad green" },
            { name: "Beetroot", reason: "Winter root vegetable" },
            { name: "Celery", reason: "Cool weather herb" },
            { name: "Leek", reason: "Winter onion family" },
            { name: "Brussels Sprouts", reason: "Cold weather brassica" },
          ],
          avoid: ["Summer crops", "Heat-loving vegetables"],
          tips: "Peak winter season. Best time for cool weather crops and European vegetables.",
        },
      },
      planting: {
        1: {
          plant_now: [
            "Tomato seeds",
            "Eggplant seeds",
            "Chili seeds",
            "Summer flowers",
          ],
          prepare_for: "Summer crop seedlings",
          soil_prep: "Prepare beds for summer planting",
        },
        2: {
          plant_now: ["Okra", "Cucumber", "Bottle gourd", "Ridge gourd"],
          prepare_for: "Monsoon crops",
          soil_prep: "Add compost for summer crops",
        },
        3: {
          plant_now: ["Corn", "Green beans", "Amaranth"],
          prepare_for: "Monsoon season",
          soil_prep: "Improve drainage for monsoon",
        },
        6: {
          plant_now: ["Monsoon vegetables", "Leafy greens"],
          prepare_for: "Post-monsoon crops",
          soil_prep: "Ensure good drainage",
        },
        10: {
          plant_now: ["Winter vegetables", "Cool season crops"],
          prepare_for: "Winter harvest",
          soil_prep: "Prepare winter beds",
        },
      },
    };

    const monthData = seasonalData[type]?.[parseInt(month)];

    if (!monthData) {
      return NextResponse.json({
        success: false,
        error: "No data available for the specified month and type",
      });
    }

    // Add general farming tips based on season
    const generalTips = {
      Winter: [
        "Water early morning to prevent frost damage",
        "Protect plants from cold winds",
        "Harvest before heavy frost",
        "Use organic mulch to retain soil warmth",
      ],
      Summer: [
        "Water early morning or late evening",
        "Provide shade during peak heat",
        "Mulch heavily to retain moisture",
        "Choose heat-resistant varieties",
      ],
      Monsoon: [
        "Ensure proper drainage",
        "Watch for fungal diseases",
        "Stake tall plants against wind",
        "Harvest frequently to prevent rot",
      ],
    };

    return NextResponse.json({
      success: true,
      month: parseInt(month),
      season: monthData.season,
      location: location,
      type: type,
      recommendations: monthData,
      general_tips: generalTips[monthData.season] || [],
      message: `Seasonal recommendations for ${monthData.season} (Month ${month}) in ${location}`,
    });
  } catch (error) {
    console.error("❌ Seasonal recommendations API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not fetch seasonal recommendations",
      },
      { status: 500 }
    );
  }
}
