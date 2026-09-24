# Supabase PostgreSQL connection test.
# Reads DATABASE_URL from the local .env file and verifies
# that the public.items table is accessible.

from dotenv import load_dotenv
import os
import psycopg2

load_dotenv()

conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()

cur.execute("SELECT to_regclass(%s)", ("public.items",))
result = cur.fetchone()

print("items table found:", result[0] is not None)

cur.close()
conn.close()