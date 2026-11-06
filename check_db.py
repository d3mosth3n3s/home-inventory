import os
from dotenv import load_dotenv
import psycopg2

load_dotenv("backend/.env")
url = os.getenv("DATABASE_URL")
print("DATABASE_URL set:", bool(url))

conn = psycopg2.connect(url)
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM items")
print("items rows:", cur.fetchone())
conn.close()