"""Refactored backend logic used by the
Streamlit UI and future REST API endpoints.

The original `v1.py` in inventory-logger still contains the UI code; this package isolates the
logic so it can be reused by a backend or a service layer without depending on
`streamlit`.
"""
