def generate_request_id():
    """Generates a unique request ID and should be unique for each request."""
    import uuid
    return f"req_{str(uuid.uuid4())}"