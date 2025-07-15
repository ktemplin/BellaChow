"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";


import type { FC, FormEvent } from "react";
import type { Store } from "./Map";
const Map = dynamic(() => import("./Map"), {
  ssr: false,
});

const Page: FC = () => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [httpsWarning, setHttpsWarning] = useState(false);
  const [range, setRange] = useState(2); // miles
  const [page, setPage] = useState(1);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [showSpecials, setShowSpecials] = useState(false);
  const [groceryList, setGroceryList] = useState<string[]>([]);
  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.protocol !== "https:") {
      setHttpsWarning(true);
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          if (err.code === 1) {
            setError("Location access denied. Please use the search box below.");
          } else {
            setError("Geolocation failed. Please use the search box below.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setError("Geolocation not supported. Please use the search box below.");
    }
  }, []);

  useEffect(() => {
    if (!position) return;
    // Use Overpass API to find actual shops (grocery, supermarket, organic, greengrocer) nearby
    const [lat, lon] = position;
    const radius = Math.round(range * 1609.34); // miles to meters
    const query = `
      [out:json][timeout:25];
      (
        node["shop"~"supermarket|grocery|organic|greengrocer"](around:${radius},${lat},${lon});
        way["shop"~"supermarket|grocery|organic|greengrocer"](around:${radius},${lat},${lon});
        relation["shop"~"supermarket|grocery|organic|greengrocer"](around:${radius},${lat},${lon});
      );
      out center 50;
    `;
    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "text/plain" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.elements) return setStores([]);
        const stores: Store[] = data.elements
          .filter((el: any) => el.tags && el.tags.name)
          .map((el: any) => ({
            id: el.id,
            lat: el.lat || (el.center && el.center.lat),
            lon: el.lon || (el.center && el.center.lon),
            name: el.tags.name,
            address: el.tags["addr:full"] || el.tags["addr:street"],
            shop: el.tags.shop,
          }));
        setStores(stores);
        setPage(1); // reset to first page on new search
      })
      .catch(() => setError("Failed to fetch stores."));
  }, [position, range]);

  // Handle location search
  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setError(null);
    setStores([]);
    // Geocode the search term
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      setError(null);
    } else {
      setError("Location not found. Try another search.");
    }
  };

  // Pagination logic
  const pageSize = 10;
  const totalPages = Math.ceil(stores.length / pageSize);
  const pagedStores = stores.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Grocery Stores Near You</h1>
      {httpsWarning && (
        <div className="text-yellow-600 bg-yellow-100 border border-yellow-300 rounded px-3 py-2 mb-2">
          <strong>Warning:</strong> Geolocation only works on HTTPS or localhost. Please use a secure connection for best results.
        </div>
      )}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4 w-full max-w-2xl">
        <input
          type="text"
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search for a city, address, or place..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
      </form>
      <div className="flex items-center gap-4 mb-4 w-full max-w-2xl">
        <label htmlFor="range" className="font-medium">Range:</label>
        <select
          id="range"
          className="border rounded px-2 py-1"
          value={range}
          onChange={e => setRange(Number(e.target.value))}
        >
          <option value={1}>1 mile</option>
          <option value={2}>2 miles</option>
          <option value={5}>5 miles</option>
          <option value={10}>10 miles</option>
        </select>
        <span className="text-black text-sm">({stores.length} found)</span>
      </div>
      <div className="w-full max-w-2xl h-[500px] rounded shadow overflow-hidden flex relative">
        <div className="flex-1 h-full">
          {position && (
            <Map
              center={position}
              stores={pagedStores}
              selectedStore={selectedStore}
              setSelectedStore={setSelectedStore}
            />
          )}
        </div>
        {selectedStore && (
          <div className="bg-white text-black dark:bg-gray-900 dark:text-white rounded shadow-lg p-4 w-80 border border-gray-200 h-full overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold">{selectedStore.name}</span>
              <button
                className="text-black hover:text-black"
                onClick={() => setSelectedStore(null)}
                aria-label="Close"
              >✕</button>
            </div>
            <div className="flex gap-2 mb-2">
              <button
                className={`bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 ${showSpecials ? 'opacity-100' : 'opacity-70'}`}
                onClick={() => setShowSpecials(true)}
              >
                View Specials
              </button>
              <button
                className={`bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 ${!showSpecials ? 'opacity-100' : 'opacity-70'}`}
                onClick={() => setShowSpecials(false)}
              >
                Grocery List
              </button>
            </div>
            {showSpecials ? (
              <div>
                <h3 className="font-semibold mb-2">Store Specials</h3>
                <div className="text-black text-sm mb-2">Specials data coming soon.</div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold mb-2">Grocery List</h3>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (newItem.trim()) {
                      setGroceryList([...groceryList, newItem.trim()]);
                      setNewItem("");
                    }
                  }}
                  className="flex gap-2 mb-2"
                >
                  <input
                    type="text"
                    className="flex-1 border rounded px-2 py-1 text-sm"
                    placeholder="Add item..."
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                  />
                  <button type="submit" className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">Add</button>
                </form>
                <ul className="list-disc pl-5 text-sm">
                  {groceryList.length === 0 && <li className="text-black">No items yet.</li>}
                  {groceryList.map((item, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{item}</span>
                      <button
                        className="text-xs text-red-500 ml-2"
                        onClick={() => setGroceryList(groceryList.filter((_, i) => i !== idx))}
                        aria-label="Remove"
                      >Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      <ul className="mt-4 w-full max-w-2xl">
        {pagedStores.map((store: Store) => (
          <li key={store.id} className="border-b py-2">
            <span className="font-semibold">{store.name}</span>
            {store.address && <span className="text-black text-sm"> — {store.address}</span>}
            {store.shop && <span className="text-black text-xs ml-2">({store.shop})</span>}
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <button
            className="px-3 py-1 rounded border bg-gray-100 disabled:opacity-50"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Page;
