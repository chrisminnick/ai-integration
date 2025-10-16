def safe_invoke(tool_fn, *args, **kwargs):
    if not permission_check(tool_fn.__name__):
        raise PermissionError(f"Invocation of {tool_fn.__name__} is not allowed")
    result = tool_fn(*args, **kwargs)
    audit_log(tool_fn.__name__, args, result)
    return result
