# flyer_scraper.py

import requests
from typing import List, Dict, Any

def get_user_location() -> str:
    # For demo: prompt user for postal code or city
    return input("Enter your postal code or city: ").strip()

class FlyerSource:
    def supports_location(self, location: str) -> bool:
        """Return True if this source serves the given location."""
        raise NotImplementedError

    def fetch_flyers(self, location: str) -> List[Dict[str, Any]]:
        """Return a list of flyer items for the location."""
        raise NotImplementedError

class FlippSource(FlyerSource):
    def supports_location(self, location: str) -> bool:
        # Flipp supports most of Canada/US; always True for demo
        return True

    def fetch_flyers(self, location: str) -> List[Dict[str, Any]]:
        # Example: Use Flipp's public API to get flyers for a postal code
        url = f"https://flipp.com/flyers?postal_code={location}"
        resp = requests.get(url)
        flyers = resp.json().get("flyers", [])
        items = []
        for flyer in flyers:
            flyer_id = flyer.get("id")
            flyer_title = flyer.get("merchant", {}).get("name")
            # Fetch flyer items (products)
            items_url = f"https://flipp.com/flyers/{flyer_id}/items"
            items_resp = requests.get(items_url)
            flyer_items = items_resp.json().get("items", [])
            for item in flyer_items:
                items.append({
                    "product_name": item.get("name"),
                    "current_price": item.get("current_price"),
                    "savings": item.get("savings"),
                    "start_date": flyer.get("valid_from"),
                    "end_date": flyer.get("valid_to"),
                    "link": f"https://flipp.com/flyers/{flyer_id}?item={item.get('id')}",
                    "store": flyer_title,
                })
        return items

# Add more sources as needed
SOURCES = [
    FlippSource(),
    # ReebeeSource(),
    # StoreWebsiteSource(),
]

def deduplicate_items(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    unique = []
    for item in items:
        key = (item["product_name"], item["store"], item["current_price"])
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique

def main():
    location = get_user_location()
    all_items = []
    for source in SOURCES:
        if source.supports_location(location):
            try:
                items = source.fetch_flyers(location)
                all_items.extend(items)
            except Exception as e:
                print(f"Error fetching from {source.__class__.__name__}: {e}")
    unique_items = deduplicate_items(all_items)
    print(f"Found {len(unique_items)} unique sale items for {location}:")
    for item in unique_items:
        print(f"{item['product_name']} - ${item['current_price']} at {item['store']} (save {item['savings']}) [{item['link']}]")

if __name__ == "__main__":
    main()
