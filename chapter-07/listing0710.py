ONBOARDING_RESPONSES = {
    "intro": "Hi {name}, welcome to DevPilot! I'm here to help you get started.",
    "next_steps": "Let's begin with these key features: code completion, debugging, and documentation.",
    "first_task": "Try typing 'def' to see intelligent code suggestions in action."
}

def get_onboarding_response(step, name=None):
    """Return precomputed response instead of generating via LLM"""
    response = ONBOARDING_RESPONSES.get(step, "I'm here to help!")
    return response.format(name=name) if name and "{name}" in response else response

def main():
    """Demonstrate precomputed onboarding flow"""
    user_name = "Sarah"
    
    print("=== DevPilot Onboarding (Precomputed Responses) ===\n")
    
    # Simulate onboarding flow
    steps = ["intro", "next_steps", "first_task"]
    
    for i, step in enumerate(steps, 1):
        print(f"Step {i}: {get_onboarding_response(step, user_name)}")
        print()

if __name__ == "__main__":
    main()
