import requests
import json

def update_exercises(api_url, old_exercise_names, new_exercise_names):
    """
    Updates multiple exercises by sending API requests for each name change.

    Args:
        api_url (str): The URL of the API endpoint for updating exercise names.
        old_exercise_names (list): A list of current exercise names to be updated.
        new_exercise_names (list): A list of new exercise names corresponding to the old names.
    """
    # Ensure the lists of old and new names are of the same length
    if len(old_exercise_names) != len(new_exercise_names):
        print("Error: The lists of old and new exercise names must be the same length.")
        return

    # Set the headers for the HTTP request
    headers = {'Content-Type': 'application/json'}

    # Iterate through each old and new exercise name pair
    for old_name, new_name in zip(old_exercise_names, new_exercise_names):
        # Construct the payload for the API request
        payload = {
            "old_exercise_name": old_name,
            "new_exercise_name": new_name
        }

        print(f"\nAttempting to update '{old_name}' to '{new_name}'...")
        print("Sending request to:", api_url)
        # Print the payload in a readable JSON format
        print("Payload:", json.dumps(payload, indent=2))
        
        try:
            # Send the POST request to the API
            response = requests.post(api_url, json=payload, headers=headers)
            # Raise an HTTPError for bad responses (4xx or 5xx)
            response.raise_for_status() 
            
            # Print success message and the JSON response from the server
            print("Update successful for:", old_name)
            try:
                print("Response:", response.json())
            except json.JSONDecodeError:
                print("Response content (not JSON):", response.text)

        except requests.exceptions.HTTPError as http_err:
            # Handle HTTP errors (e.g., 404 Not Found, 500 Server Error)
            print(f"HTTP error occurred while updating '{old_name}': {http_err}")
            print("Response status code:", response.status_code)
            print("Response content:", response.text) # Print full response for debugging
        except requests.exceptions.ConnectionError as conn_err:
            # Handle errors related to network connectivity
            print(f"Connection error occurred while updating '{old_name}': {conn_err}")
        except requests.exceptions.Timeout as timeout_err:
            # Handle request timeout errors
            print(f"Timeout error occurred while updating '{old_name}': {timeout_err}")
        except requests.exceptions.RequestException as req_err:
            # Handle other request-related errors
            print(f"An unexpected error occurred with the request for '{old_name}': {req_err}")
        except Exception as e:
            # Handle any other unforeseen errors
            print(f"An general error occurred while processing '{old_name}': {e}")

# API Gateway URL for changing exercise names
api_url = "https://6a29no5ke5.execute-api.us-east-1.amazonaws.com/workoutStage1/changeName"

# Full lists of old and new exercise names (currently commented out)
'''
old_exercise_names_full = [
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

new_exercise_names_full = [
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

# Shorter lists for testing or specific updates
old_exercise_names_test = ["Assisted Dips", "Squats"]
new_exercise_names_test = ['Dips', "Smith Machine Squats"]

# To run with the full list, uncomment the full lists above and comment out the test lists.
# Then, use old_exercise_names_full and new_exercise_names_full in the function call.
# Example for full list:
# update_exercises(api_url, old_exercise_names_full, new_exercise_names_full)

# Run the batch update with the test lists
if __name__ == "__main__":
    print("Starting exercise name update process...")
    update_exercises(api_url, old_exercise_names_test, new_exercise_names_test)
    print("\nExercise name update process finished.")
