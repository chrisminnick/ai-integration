def choose_action(context, available_modalities):
    # context includes embeddings, confidence measures, user goal
    if "vision" in available_modalities and context["vision_confidence"] > 0.8:
        return ("analyze_image", context["latest_image"])
    if "text" in available_modalities:
        return ("interpret_text", context["user_query"])
    return ("ask_clarification", None)
