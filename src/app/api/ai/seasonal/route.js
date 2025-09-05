import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || new Date().getMonth() + 1;
    const location = searchParams.get("location") || "India";
    const type = searchParams.get("type") || "both"; // vegetables, planting, both

    // Seasonal data for Indian agriculture
    const seasonalData = {
      // Winter (December - February)
      12: {
        season: "Winter",
        vegetables: [
          "Cauliflower",
          "Cabbage",
          "Carrot",
          "Radish",
          "Peas",
          "Spinach",
          "Fenugreek",
          "Coriander",
        ],
        planting: ["Tomato", "Brinjal", "Chili", "Onion", "Garlic"],
      },
      1: {
        season: "Winter",
        vegetables: [
          "Cauliflower",
          "Cabbage",
          "Carrot",
          "Radish",
          "Peas",
          "Spinach",
          "Fenugreek",
          "Coriander",
        ],
        planting: ["Tomato", "Brinjal", "Chili", "Onion", "Garlic"],
      },
      2: {
        season: "Winter",
        vegetables: [
          "Cauliflower",
          "Cabbage",
          "Carrot",
          "Radish",
          "Peas",
          "Spinach",
          "Fenugreek",
          "Coriander",
        ],
        planting: ["Summer vegetables preparation"],
      },

      // Spring (March - May)
      3: {
        season: "Spring",
        vegetables: [
          "Tomato",
          "Brinjal",
          "Chili",
          "Cucumber",
          "Bottle Gourd",
          "Bitter Gourd",
        ],
        planting: [
          "Okra",
          "Cucumber",
          "Bottle Gourd",
          "Ridge Gourd",
          "Summer Spinach",
        ],
      },
      4: {
        season: "Spring",
        vegetables: [
          "Tomato",
          "Brinjal",
          "Chili",
          "Cucumber",
          "Bottle Gourd",
          "Bitter Gourd",
          "Okra",
        ],
        planting: ["Okra", "Cucumber", "Summer vegetables"],
      },
      5: {
        season: "Spring",
        vegetables: [
          "Okra",
          "Cucumber",
          "Bottle Gourd",
          "Ridge Gourd",
          "Bitter Gourd",
          "Summer Spinach",
        ],
        planting: ["Monsoon crop preparation"],
      },

      // Monsoon (June - September)
      6: {
        season: "Monsoon",
        vegetables: ["Okra", "Brinjal", "Chili", "Ginger", "Turmeric"],
        planting: [
          "Rice",
          "Maize",
          "Cotton",
          "Sugarcane",
          "Monsoon vegetables",
        ],
      },
      7: {
        season: "Monsoon",
        vegetables: [
          "Okra",
          "Brinjal",
          "Chili",
          "Ginger",
          "Turmeric",
          "Green Leafy Vegetables",
        ],
        planting: ["Rice", "Maize", "Monsoon leafy vegetables"],
      },
      8: {
        season: "Monsoon",
        vegetables: ["Okra", "Brinjal", "Chili", "Green Leafy Vegetables"],
        planting: ["Post-monsoon crop preparation"],
      },
      9: {
        season: "Monsoon",
        vegetables: ["Okra", "Brinjal", "Chili", "Green Leafy Vegetables"],
        planting: ["Winter crop preparation"],
      },

      // Post-Monsoon/Autumn (October - November)
      10: {
        season: "Post-Monsoon",
        vegetables: ["Tomato", "Brinjal", "Chili", "Onion", "Garlic"],
        planting: [
          "Cauliflower",
          "Cabbage",
          "Carrot",
          "Radish",
          "Peas",
          "Winter vegetables",
        ],
      },
      11: {
        season: "Post-Monsoon",
        vegetables: [
          "Tomato",
          "Brinjal",
          "Chili",
          "Onion",
          "Garlic",
          "Early Winter Vegetables",
        ],
        planting: [
          "Cauliflower",
          "Cabbage",
          "Carrot",
          "Radish",
          "Peas",
          "Spinach",
        ],
      },
    };

    const monthNum = parseInt(month);
    const currentData =
      seasonalData[monthNum] || seasonalData[new Date().getMonth() + 1];

    // Regional adjustments based on location
    const regionalAdjustments = {
      "North India": {
        additionalVegetables:
          monthNum >= 11 || monthNum <= 2 ? ["Mustard Greens", "Turnip"] : [],
        notes: "Extreme winters, hot summers",
      },
      "South India": {
        additionalVegetables: ["Coconut", "Banana", "Curry Leaves"],
        notes: "Tropical climate, year-round growing",
      },
      "West India": {
        additionalVegetables:
          monthNum >= 6 && monthNum <= 9
            ? ["Monsoon Vegetables"]
            : ["Drought Resistant Crops"],
        notes: "Monsoon dependent, arid regions",
      },
      "East India": {
        additionalVegetables: ["Rice", "Fish Vegetables"],
        notes: "High rainfall, fertile soil",
      },
    };

    // Farming tips based on season
    const farmingTips = {
      Winter: [
        "Protect crops from frost using mulching",
        "Reduce watering frequency",
        "Focus on root vegetables and leafy greens",
        "Prepare soil for summer crops",
      ],
      Spring: [
        "Increase watering as temperature rises",
        "Start summer crop preparation",
        "Harvest winter crops",
        "Apply organic fertilizers",
      ],
      Monsoon: [
        "Ensure proper drainage to prevent waterlogging",
        "Watch for fungal diseases",
        "Plant monsoon-loving crops",
        "Harvest rainwater for later use",
      ],
      "Post-Monsoon": [
        "Prepare soil for winter crops",
        "Control post-monsoon pests",
        "Start winter vegetable nurseries",
        "Apply compost and organic matter",
      ],
    };

    const response = {
      success: true,
      month: monthNum,
      monthName: new Date(2024, monthNum - 1).toLocaleString("default", {
        month: "long",
      }),
      season: currentData.season,
      location: location,
      data: {
        inSeason: type === "planting" ? [] : currentData.vegetables,
        toPlant: type === "vegetables" ? [] : currentData.planting,
        farmingTips: farmingTips[currentData.season] || [],
        regionalNotes: regionalAdjustments[location] || {
          additionalVegetables: [],
          notes: "General Indian climate",
        },
      },
      recommendations: {
        buy: currentData.vegetables.slice(0, 5),
        plant: currentData.planting.slice(0, 5),
        avoid:
          monthNum >= 4 && monthNum <= 6
            ? ["Heavy root vegetables in extreme heat"]
            : monthNum >= 6 && monthNum <= 9
            ? ["Crops sensitive to excess water"]
            : [],
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Seasonal data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Could not get seasonal information. Please try again.",
        data: null,
      },
      { status: 500 }
    );
  }
}
