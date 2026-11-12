import sqlite3
from pathlib import Path

db_path = Path(__file__).parent / "broken_building.db"
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

def add_col_if_not_exists(table, col, col_type):
    cursor.execute(f"PRAGMA table_info({table})")
    cols = [row[1] for row in cursor.fetchall()]
    if col not in cols:
        print(f"Adding {col} ({col_type}) to {table}...")
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
    else:
        print(f"{col} already in {table}.")

add_col_if_not_exists("reports", "citizen_email", "VARCHAR DEFAULT 'rajesh.citizen@gmail.com'")
add_col_if_not_exists("notifications", "recipient_email", "VARCHAR DEFAULT 'rajesh.citizen@gmail.com'")
add_col_if_not_exists("notifications", "email_sent", "BOOLEAN DEFAULT 1")
add_col_if_not_exists("notifications", "email_subject", "VARCHAR")

conn.commit()
conn.close()
print("Migration completed successfully!")
