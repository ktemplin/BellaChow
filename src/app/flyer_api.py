from fastapi import FastAPI, Query
from typing import List
from flyer_sources import deduplicate_items, FlippSource  # Update import if needed

app = FastAPI()

@app.get("/api/flyers")
def get_flyers(location: str):
    sources = [FlippSource()]
    all_items = []
    for source in sources:
        if source.supports_location(location):
            try:
                items = source.fetch_flyers(location)
                all_items.extend(items)
            except Exception as e:
                return {"error": str(e)}
    unique_items = deduplicate_items(all_items)
    return {"items": unique_items}