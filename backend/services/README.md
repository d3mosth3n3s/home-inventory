"""Compatibility note: this package holds the refactored backend logic used by the
Streamlit UI and future REST API endpoints.

The original `v1.py` still contains the UI code; this package isolates the gritty
logic so it can be reused by a backend or a service layer without depending on
`streamlit`.
"""
