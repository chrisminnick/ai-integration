"""Tool definitions for the Lab 6 agent.

Each tool is a Python function plus an OpenAI-style schema. The agent in
agent.py only ever calls functions listed in TOOL_REGISTRY.
"""

import datetime


def calculator(expression: str) -> str:
    """Evaluate a math expression like '2 + 2 * 3'. Returns the result as a string."""
    try:
        # NOTE: eval() is unsafe in production — use a parser like asteval in real code.
        # __builtins__ is wiped so the LLM can't reach os.system, open, etc.
        result = eval(expression, {"__builtins__": {}}, {})
        return str(result)
    except Exception as e:
        return f"Error: {e}"


def get_time(timezone: str = "UTC") -> str:
    """Get the current time. Only UTC is supported in this lab."""
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


# A fake "knowledge base" the agent can query
KNOWLEDGE = {
    "ceo": "The CEO of the company is Alice Smith.",
    "headquarters": "Our headquarters is in Austin, TX.",
    "founded": "The company was founded in 2018.",
}


def lookup(key: str) -> str:
    """Look up internal company information. Valid keys: ceo, headquarters, founded."""
    return KNOWLEDGE.get(key.lower(), f"No information found for '{key}'.")


def delete_user(user_id: str) -> str:
    """Delete a user account. THIS IS DESTRUCTIVE — gated by human confirmation in agent.py."""
    return f"User {user_id} would be deleted (but we're just demoing)."


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "calculator",
            "description": "Evaluate a math expression and return the result.",
            "parameters": {
                "type": "object",
                "properties": {
                    "expression": {
                        "type": "string",
                        "description": "Math expression, e.g. '47 * 89'",
                    }
                },
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_time",
            "description": "Get the current UTC time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone": {
                        "type": "string",
                        "description": "Timezone, default UTC",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "lookup",
            "description": "Look up internal company information by key.",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "One of: ceo, headquarters, founded",
                    }
                },
                "required": ["key"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "delete_user",
            "description": "Permanently delete a user account. Requires user confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {
                        "type": "string",
                        "description": "The id of the user to delete",
                    }
                },
                "required": ["user_id"],
            },
        },
    },
]


TOOL_REGISTRY = {
    "calculator": calculator,
    "get_time": get_time,
    "lookup": lookup,
    "delete_user": delete_user,
}


DESTRUCTIVE_TOOLS = {"delete_user"}
