import requests
import os


# BMI Calculation Classes
class BMI:
    def __init__(self):
        self.weight_kg = 0.0
        self.height_m = 0.0
        self.height_feet = 0.0
        self.height_inches = 0.0
        self.height_total = 0.0
        self.weight_lb = 0.0

    def get_bmi_category(self, bmi):
        if bmi < 18.5:
            return "You are Underweight"
        elif 18.5 <= bmi <= 24.9:
            return "You are Normal weight"
        elif 25.0 <= bmi <= 29.9:
            return "You are Overweight"
        else:
            return "You are Suffering from obesity"


class BMIImperial(BMI):
    def __init__(self, weight_lb, height_feet, height_inches):
        super().__init__()
        self.weight_lb = weight_lb
        self.height_feet = height_feet
        self.height_inches = height_inches
        self.height_total = height_feet * 12 + height_inches

    def calculate_bmi(self):
        return (self.weight_lb / (self.height_total ** 2)) * 703


class BMIMetric(BMI):
    def __init__(self, weight_kg, height_m):
        super().__init__()
        self.weight_kg = weight_kg
        self.height_m = height_m

    def calculate_bmi(self):
        return self.weight_kg / (self.height_m ** 2)


class MealPlanner:
    def __init__(self, app_id, app_key):
        self.app_id = app_id
        self.app_key = app_key
        self.base_url = "https://api.edamam.com/api/recipes/v2/by-uri"  # Updated endpoint

    def get_meal_plan(self, bmi_category):
        category_mapping = {
            "You are Underweight": {"calories": "600-800", "diet": "high-protein"},
            "You are Normal weight": {"calories": "500-700", "diet": "balanced"},
            "You are Overweight": {"calories": "400-600", "diet": "low-fat"},
            "You are Suffering from obesity": {"calories": "300-500", "diet": "low-carb"}
        }

        meal_params = category_mapping.get(bmi_category, {"calories": "500-700", "diet": "balanced"})

        headers = {
            "Accept": "application/json",
            "Edamam-Account-User": "0",  # Added required header
        }

        params = {
            "type": "public",
            "q": "healthy dinner",
            "app_id": self.app_id,
            "app_key": self.app_key,
            "diet": meal_params["diet"],
            "calories": meal_params["calories"],
            "imageSize": "REGULAR",
            "random": "true"
        }

        try:
            print("Sending request to Edamam API...")
            print(f"URL: {self.base_url}")
            print(f"Parameters: {params}")

            response = requests.get(
                self.base_url,
                headers=headers,
                params=params
            )

            print(f"Response status code: {response.status_code}")
            if response.status_code != 200:
                print(f"Error response: {response.text}")
                return None

            data = response.json()

            if not data.get("hits"):
                print("No recipes found in response")
                return None

            meals = []
            for hit in data.get("hits", [])[:3]:
                recipe = hit["recipe"]
                meals.append({
                    "name": recipe.get("label", "Unnamed Recipe"),
                    "calories": round(float(recipe.get("calories", 0))),
                    "url": recipe.get("url", "No URL available"),
                    "ingredients": recipe.get("ingredientLines", [])
                })

            return {"meals": meals}

        except requests.exceptions.RequestException as e:
            print(f"Error fetching meal plan: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None


# Simplified AI Assistant class
class AIAssistant:
    def send_query(self, user_query):
        """
        Provides basic responses about health and nutrition.
        """
        query = user_query.lower()

        if "bmi" in query:
            return "BMI (Body Mass Index) is a measure of body fat based on height and weight. A healthy BMI ranges from 18.5 to 24.9."
        elif "meal" in query or "diet" in query:
            return "I can help you find healthy meal plans based on your BMI category. Use option 1 from the main menu to calculate your BMI and get personalized meal suggestions."
        elif "exercise" in query or "workout" in query:
            return "Regular exercise is important for maintaining a healthy weight. Aim for at least 150 minutes of moderate activity or 75 minutes of vigorous activity per week."
        else:
            return "I can provide information about BMI, meal planning, and general health advice. Please feel free to ask specific questions about these topics."


def main():
    # Using your provided API credentials
    app_id = "db3b57e0"
    app_key = "d7b9cc4f79555d83ab0a1b72680bce4f"

    meal_planner = MealPlanner(app_id, app_key)
    ai_assistant = AIAssistant()

    print("Welcome to Fit Fusion!")
    print("You can calculate your BMI, get meal plans, and talk to our AI Assistant.")

    while True:
        print("\nMenu:")
        print("1. Calculate BMI and Get Meal Plan")
        print("2. Talk to AI Assistant")
        print("3. Exit")

        choice = input("Enter your choice (1/2/3): ")

        if choice == "1":
            try:
                weight_kg = float(input("Enter your weight in kg: "))
                height_m = float(input("Enter your height in meters: "))

                bmi_metric = BMIMetric(weight_kg, height_m)
                bmi_value = bmi_metric.calculate_bmi()
                bmi_category = bmi_metric.get_bmi_category(bmi_value)

                print(f"\nBMI: {bmi_value:.2f}")
                print(f"Category: {bmi_category}")

                print("\nFetching meal recommendations...")
                meal_plan = meal_planner.get_meal_plan(bmi_category)
                if meal_plan and meal_plan.get("meals"):
                    print("\nRecommended Meals:")
                    for meal in meal_plan["meals"]:
                        print(f"\n- {meal['name']}")
                        print(f"  Calories: {meal['calories']}")
                        print("  Ingredients:")
                        for ingredient in meal["ingredients"]:
                            print(f"    • {ingredient}")
                        print(f"  Recipe URL: {meal['url']}")
                else:
                    print("Unable to fetch meal plans at the moment. Please try again later.")
            except ValueError:
                print("Invalid input. Please enter numeric values.")
            except Exception as e:
                print(f"An error occurred: {e}")

        elif choice == "2":
            print("\nAI Assistant: Ask me anything about health, nutrition, or BMI!")
            print("Type 'exit' to return to the main menu.")

            while True:
                user_query = input("\nYou: ")
                if user_query.lower() == "exit":
                    break
                ai_response = ai_assistant.send_query(user_query)
                print(f"AI Assistant: {ai_response}")

        elif choice == "3":
            print("Goodbye! Stay healthy!")
            break

        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    main()