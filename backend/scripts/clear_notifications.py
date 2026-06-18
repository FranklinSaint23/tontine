from app.core.database import SessionLocal
from app.models.notification import Notification

if __name__ == '__main__':
    db = SessionLocal()
    try:
        deleted = db.query(Notification).delete()
        db.commit()
        print(f"Deleted {deleted} notifications")
    except Exception as e:
        print('Error:', e)
        db.rollback()
    finally:
        db.close()
