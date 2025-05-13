import requests
import json

def update_exercises(api_url, old_exercise_names, new_exercise_names):
    """Updates multiple exercises by sending API requests for each name change."""
    if len(old_exercise_names) != len(new_exercise_names):
        print("Error: The lists of old and new exercise names must be the same length.")
        return

    headers = {'Content-Type': 'application/json'}

    for old_name, new_name in zip(old_exercise_names, new_exercise_names):
        payload = {
            "old_exercise_name": old_name,
            "new_exercise_name": new_name
        }

        print("\nSending request to:", api_url)
        print("Payload:", json.dumps(payload, indent=2))
        
        try:
            response = requests.post(api_url, json=payload, headers=headers)
            response.raise_for_status()  # Raise an error for bad responses
            print("Update successful:", response.json())
        except requests.exceptions.HTTPError as err:
            print("HTTP error occurred:", err)
            print("Response content:", response.text)  # Print full response for debugging
        except Exception as e:
            print("An error occurred:", e)

# API Gateway URL
api_url = "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/changeName"

# **Full Old & New Exercise Name Lists**
'''old_exercise_names = [
    "Pushups", "Assisted Dips", "Dumbbell Bench Press", "Dumbbell Incline Press", "Barbell Bench Press", 
    "Barbell Incline Press", "Chest Press Machine", "Cable Crossovers", "Incline Cable Crossovers", 
    "Decline Cable Crossovers", "Pec Deck", "Squats", "Hack Squat", "Leg Press", "Leg Extensions", 
    "Deadlifts", "Seated Hamstring Curls", "Lying Hamstring Curl", "Smith Machine Goodmornings", 
    "Romanian Deadlifts", "Bulgarian Split Squats", "Calf Raises", "Seated Calf Raises", "Tib Raises", 
    "Glute Machine", "Hip Thrusts", "Abductor Machine", "Adductor Machine", "Dumbbell Lunges", 
    "Sprinter Lunges Dumbbell", "Sprinter Lunges Smith Machine", "Pull Ups", "Assisted Pull Ups", 
    "Chin Ups", "Assisted Chin-Ups", "Lat Pulldown", "Straight Arm Cable Pulldown", "Dumbbell Rows", 
    "Barbell Rows", "Cable Rows", "T Bar Row", "High Row Machine", "Low Row Machine", 
    "Back Extensions Bench", "Back Extensions Machine", "Dumbbell Shrugs", "Barbell Shrugs", 
    "Trap Bar Shrugs", "Incline Trap Raise", "Tricep Press Machine", "Cable Overhead Tricep Extensions", 
    "Tricep Pulldown Rope", "Tricep Pulldown Rope Single-Arm", "Dumbbell Kickbacks", "Cable Kickbacks", 
    "Skullcrushers", "Bicep Curls Dumbbell", "Bicep Curls Barbell", "Bicep Curls Cable", 
    "Bicep Curls Cable Non-Machine", "Reverse Curls Cable Non-Machine", "Reverse Curls Cable", 
    "Reverse Curls Dumbbell", "Reverse Curls Barbell", "Hammer Curls Dumbbell", "Forearm Curls Pronated", 
    "Forearm Curls Supinated", "Shoulder Press Machine", "Shoulder Press Dumbbell", "Shoulder Press Barbell", 
    "Lateral Raises", "Cable Lateral Raises", "Face Pulls", "Rotator Cuff Band", "External Rotation Horizontal", 
    "External Rotation Vertical", "Rotator Cuff Cable", "Crunch Machine", "V-Crunch Machine", "Oblique Machine"
]

new_exercise_names = [
    "Pushups", "Dips - Machine", "Bench Press - Dumbbell", "Incline Press - Dumbbell", "Bench Press - Barbell", 
    "Incline Press - Barbell", "Chest Press - Machine", "Crossovers - Cables", "Incline Crossovers - Cables", 
    "Decline Crossovers - Cables", "Pec Deck - Machine", "Squats - Barbell", "Hack Squat - Machine", "Leg Press - Machine", 
    "Leg Extensions - Machine", "Deadlifts - Barbell", "Seated Hamstring Curls - Machine", "Lying Hamstring Curl - Machine", 
    "Goodmornings - Smith Machine", "Romanian Deadlifts - Barbell", "Bulgarian Split Squats - Dumbbell", "Calf Raises - Machine", 
    "Seated Calf Raises - Machine", "Tib Raises - Machine", "Glute Kickbacks - Machine", "Hip Thrusts - Barbell", 
    "Abductor - Machine", "Adductor - Machine", "Lunges - Dumbbell", "Sprinter Lunges - Dumbbell", "Sprinter Lunges - Smith Machine", 
    "Pull Ups - Bodyweight", "Pull Ups - Assisted", "Chin Ups - Bodyweight", "Chin Ups - Assisted", "Lat Pulldown - Machine", 
    "Straight Arm Pulldown - Cable", "Rows - Dumbbell", "Rows - Barbell", "Rows - Cable", "T Bar Row - Barbell", 
    "High Row - Machine", "Low Row - Machine", "Back Extensions - Bench", "Back Extensions - Machine", "Shrugs - Dumbbell", 
    "Shrugs - Barbell", "Shrugs - Trap Bar", "Incline Trap Raise - Dumbbell", "Tricep Press - Machine", 
    "Overhead Tricep Extensions - Cable", "Tricep Pulldown - Cable", "Tricep Pulldown Single-Arm - Cable", 
    "Kickbacks - Dumbbell", "Kickbacks - Cable", "Skullcrushers - Barbell", "Bicep Curls - Dumbbell", 
    "Bicep Curls - Barbell", "Bicep Curls - Machine", "Bicep Curls - Cable", "Reverse Curls - Cable", 
    "Reverse Curls - Machine", "Reverse Curls - Dumbbell", "Reverse Curls - Barbell", "Hammer Curls - Dumbbell", 
    "Forearm Curls - Pronated", "Forearm Curls - Supinated", "Shoulder Press - Machine", "Shoulder Press - Dumbbell", 
    "Shoulder Press - Barbell", "Lateral Raises - Dumbbell", "Lateral Raises - Cable", "Face Pulls - Cable", 
    "Rotator Cuff - Band", "External Rotation Horizontal - Cable", "External Rotation Vertical - Cable", "Rotator Cuff - Cable", 
    "Crunch Machine - Machine", "V-Crunch Machine - Machine", "Oblique - Machine"
]
'''
old_exercise_names = ["Assisted Dips", "Squats"]
new_exercise_names = ['Dips', "Smith Machine Squats"]
# Run the batch update
update_exercises(api_url, old_exercise_names, new_exercise_names)
