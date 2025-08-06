# Enhanced Voice Dictation with Cost Calculation

## 🎯 Overview
The enhanced voice dictation system now supports ingredient weights, prices, and automatic cost calculation with menu pricing suggestions.

## 📝 Enhanced Voice Input Examples

### Current Voice Input:
```
"This is Pad Thai with rice noodles, chicken, bean sprouts, eggs"
```

### Enhanced Voice Input:
```
"This is Pad Thai with 200 grams rice noodles at 3 euros per kilo, 150 grams chicken breast at 8 euros per kilo, 100 grams bean sprouts at 2 euros per kilo, 2 eggs at 3 euros per dozen"
```

## 🔧 Features Implemented

### 1. **Enhanced Speech Parsing** (`src/utils/enhancedSpeechParsing.ts`)
- Extracts ingredient weights: "200 grams", "150g", "2 pieces"
- Recognizes pricing: "3 euros per kilo", "€8 per kg", "5 dollars per dozen"
- Handles various units: grams, kg, pounds, ounces, ml, liters, cups, pieces, dozen
- Converts spoken numbers: "half", "quarter", "two", "twenty"
- Detects preparation time: "takes 15 minutes", "30 minutes prep time"
- Identifies serving size: "serves 4", "for 2 people"

### 2. **Cost Calculation Engine** (`src/utils/costCalculation.ts`)
- Calculates total food cost with wastage percentage
- Adds labor cost based on preparation time
- Includes overhead costs (utilities, rent, etc.)
- Generates pricing suggestions for 25%, 30%, and 35% food cost targets
- Provides profit margin analysis
- Suggests cost optimizations

### 3. **Visual Cost Breakdown** (`src/components/CostBreakdownComponent.tsx`)
- Interactive cost breakdown with tabs
- Ingredient-by-ingredient cost analysis
- Price target selector (25%, 30%, 35% food cost)
- Cost optimization suggestions
- Profitability analysis
- Real-time pricing calculator

### 4. **Database Schema Extensions** (`src/integrations/supabase/enhanced-types.ts`)
- Enhanced ingredient tracking with price history
- Recipe costing tables
- Unit conversion system
- Cost calculation metadata

## 🎙️ Voice Input Examples

### German Example:
```
"Das ist Schnitzel mit 150 Gramm Schweinefleisch für 12 Euro pro Kilo, 50 Gramm Semmelbrösel für 2 Euro pro Kilo, 1 Ei für 3 Euro pro Dutzend, dauert 20 Minuten"
```

**Parsed Result:**
- Dish: Schnitzel
- Ingredients:
  - 150g Schweinefleisch @ €12/kg = €1.80
  - 50g Semmelbrösel @ €2/kg = €0.10
  - 1 Ei @ €3/dozen = €0.25
- Preparation: 20 minutes
- **Total Food Cost: €2.15**
- **Suggested Price: €7.17** (30% food cost target)

### English Example:
```
"This is Chicken Tikka Masala with 200 grams chicken breast at 8 euros per kilo, 100ml coconut milk at 4 euros per liter, 50 grams basmati rice at 3 euros per kilo, preparation time 25 minutes"
```

**Parsed Result:**
- Dish: Chicken Tikka Masala
- Ingredients:
  - 200g Chicken breast @ €8/kg = €1.60
  - 100ml Coconut milk @ €4/L = €0.40
  - 50g Basmati rice @ €3/kg = €0.15
- Preparation: 25 minutes
- **Total Food Cost: €2.15**
- **Suggested Price: €7.17** (30% food cost target)

## 💰 Cost Calculation Features

### Automatic Price Suggestions:
- **25% Food Cost (Competitive)**: Lower margin, competitive pricing
- **30% Food Cost (Balanced)**: Standard restaurant target
- **35% Food Cost (Conservative)**: Higher margin, premium positioning

### Cost Breakdown:
- **Food Cost**: Raw ingredient costs + 5% wastage
- **Labor Cost**: Preparation time × €15/hour average
- **Overhead**: 25% of food cost (utilities, rent, etc.)
- **Profit Margin**: Calculated at each price target

### Smart Features:
- **Unit Conversions**: Automatic conversion between grams, kg, pounds, ounces
- **Price Rounding**: Rounds to common menu prices (.50, .90, .95)
- **Cost Optimization**: Suggests ingredient substitutions and portion adjustments
- **Seasonality Awareness**: Factors in seasonal price variations

## 🎨 UI Components

### Quick Cost Summary:
Displays estimated costs and pricing targets in a compact format when cost data is available.

### Detailed Cost Breakdown:
- **Cost Breakdown Tab**: Ingredient-by-ingredient analysis with progress bars
- **Pricing Tab**: Interactive price target selection with profit margins
- **Optimization Tab**: Cost reduction suggestions with difficulty ratings
- **Analysis Tab**: Overall cost structure and profitability insights

## 🔄 Integration Points

### Voice Input Processing:
1. Enhanced speech parsing extracts weights, units, and prices
2. Text cleaning removes stutters and repetitions
3. Language detection fills appropriate language fields
4. Cost calculation runs automatically when pricing data is found
5. Visual breakdown appears with optimization suggestions

### Menu Form Integration:
- Preparation time field added to basic info section
- Cost analysis section appears when pricing data is available
- Suggested prices automatically populate pricing fields
- Real-time cost updates as ingredients change

## 📊 Example Cost Analysis

### Input:
```
"Beef Burger with 150 grams ground beef at 12 euros per kilo, 1 burger bun at 50 cents each, 20 grams cheese at 15 euros per kilo, prep time 8 minutes"
```

### Output:
```
Food Costs:
- Ground beef (150g @ €12/kg): €1.80
- Burger bun (1 piece @ €0.50): €0.50  
- Cheese (20g @ €15/kg): €0.30
- Wastage (5%): €0.13
Total Food Cost: €2.73

Labor Cost (8 min @ €15/hr): €2.00
Overhead (25%): €0.68
Total Cost: €5.41

Pricing Suggestions:
- 25% food cost target: €10.90
- 30% food cost target: €9.10
- 35% food cost target: €7.80

Recommended: €9.10 (balanced approach)
```

## 🚀 Benefits

1. **Time Savings**: Automatic cost calculation eliminates manual price research
2. **Accuracy**: Consistent pricing methodology across all menu items
3. **Profitability**: Ensures target food cost percentages are met
4. **Optimization**: Identifies cost reduction opportunities
5. **Language Support**: Works in both German and English
6. **Real-time**: Instant feedback during menu creation

## 📈 Future Enhancements

- Integration with supplier price feeds
- Seasonal pricing adjustments
- Nutritional cost analysis
- Competitive pricing comparisons
- Recipe scaling calculations
- Inventory cost tracking