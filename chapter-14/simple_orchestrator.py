def orchestrator(context, available_modalities):
    action, payload = choose_action(context, available_modalities)
    if action == "analyze_image":
        return vision_agent.handle(payload, context)
    elif action == "interpret_text":
        return text_agent.handle(payload, context)
    else:
        return fallback_agent.handle(context)
