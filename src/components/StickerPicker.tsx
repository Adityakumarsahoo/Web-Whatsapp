import React, { useState, useEffect } from "react";
import { Star, Clock, Flame, Smile, Cat, Apple, Plane } from "lucide-react";
import { Sticker } from "../types";
import { motion } from "motion/react";

interface StickerPickerProps {
  onSelectSticker: (stickerUrl: string) => void;
}

const CATEGORIES = [
  { id: "all", name: "Trending", icon: Flame },
  { id: "smileys", name: "Smileys", icon: Smile },
  { id: "animals", name: "Animals", icon: Cat },
  { id: "food", name: "Food", icon: Apple },
  { id: "travel", name: "Travel", icon: Plane }
];

export default function StickerPicker({ onSelectSticker }: StickerPickerProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [recentStickers, setRecentStickers] = useState<string[]>([]);
  const [favoriteStickers, setFavoriteStickers] = useState<string[]>([]);
  const [showRecents, setShowRecents] = useState<boolean>(false);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);

  useEffect(() => {
    // Fetch stickers from server
    fetch("/api/stickers")
      .then((res) => res.json())
      .then((data) => setStickers(data))
      .catch((err) => console.error("Error loading stickers", err));

    // Load recents and favorites from localStorage
    try {
      const recents = JSON.parse(localStorage.getItem("recent_stickers") || "[]");
      const favorites = JSON.parse(localStorage.getItem("favorite_stickers") || "[]");
      setRecentStickers(recents);
      setFavoriteStickers(favorites);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const filteredStickers = stickers.filter((sticker) => {
    if (showRecents) return recentStickers.includes(sticker.url);
    if (showFavorites) return favoriteStickers.includes(sticker.url);
    if (activeCategory === "all") return true;
    return sticker.category === activeCategory;
  });

  const handleSelect = (url: string) => {
    // Add to recents
    const updatedRecents = [url, ...recentStickers.filter((u) => u !== url)].slice(0, 16);
    setRecentStickers(updatedRecents);
    localStorage.setItem("recent_stickers", JSON.stringify(updatedRecents));
    onSelectSticker(url);
  };

  const toggleFavorite = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    let updated: string[];
    if (favoriteStickers.includes(url)) {
      updated = favoriteStickers.filter((u) => u !== url);
    } else {
      updated = [...favoriteStickers, url];
    }
    setFavoriteStickers(updated);
    localStorage.setItem("favorite_stickers", JSON.stringify(updated));
  };

  const selectCat = (catId: string) => {
    setShowRecents(false);
    setShowFavorites(false);
    setActiveCategory(catId);
  };

  return (
    <div className="flex flex-col h-64 bg-[#1f2c34] border border-[#2f3b43] rounded-2xl overflow-hidden shadow-2xl glass-panel">
      {/* Categories Toolbar */}
      <div className="flex items-center justify-around border-b border-[#2a373f] bg-[#111b21] py-2 shrink-0 select-none">
        {/* Recent */}
        <button
          onClick={() => {
            setShowRecents(true);
            setShowFavorites(false);
          }}
          className={`p-2 rounded-xl transition-all relative ${
            showRecents ? "text-[#00a884] bg-[#202c33]" : "text-[#8696a0] hover:text-[#e9edef]"
          }`}
          title="Recent Stickers"
        >
          <Clock className="w-4 h-4" />
        </button>

        {/* Favorites */}
        <button
          onClick={() => {
            setShowFavorites(true);
            setShowRecents(false);
          }}
          className={`p-2 rounded-xl transition-all relative ${
            showFavorites ? "text-[#eab308] bg-[#202c33]" : "text-[#8696a0] hover:text-[#eab308]"
          }`}
          title="Favorites"
        >
          <Star className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-[#2a373f]" />

        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = !showRecents && !showFavorites && activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => selectCat(cat.id)}
              className={`p-2 rounded-xl transition-all relative ${
                isActive ? "text-[#00a884] bg-[#202c33]" : "text-[#8696a0] hover:text-[#e9edef]"
              }`}
              title={cat.name}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Stickers Grid */}
      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-3 justify-items-center bg-[#182229]/40">
        {filteredStickers.length > 0 ? (
          filteredStickers.map((sticker) => {
            const isFav = favoriteStickers.includes(sticker.url);
            return (
              <motion.div
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 450, damping: 20 }}
                key={sticker.id}
                onClick={() => handleSelect(sticker.url)}
                className="relative group p-2 rounded-xl hover:bg-[#202c33]/80 cursor-pointer transition-all flex items-center justify-center select-none border border-transparent hover:border-[#00a884]/20"
              >
                <img
                  src={sticker.url}
                  alt="Sticker"
                  className="w-16 h-16 object-contain"
                />
                {/* Favorite Star Overlay */}
                <button
                  onClick={(e) => toggleFavorite(e, sticker.url)}
                  className={`absolute top-0.5 right-0.5 p-1 rounded-full bg-[#111b21]/90 opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 ${
                    isFav ? "text-[#eab308]" : "text-[#8696a0]"
                  }`}
                >
                  <Star className="w-3 h-3 fill-current" />
                </button>
              </motion.div>
            );
          })
        ) : (
          <div className="col-span-4 text-center text-xs text-[#8696a0] py-12 font-sans">
            {showRecents
              ? "No recently used stickers yet."
              : showFavorites
              ? "Star stickers to add them here!"
              : "No stickers found in this category."}
          </div>
        )}
      </div>
    </div>
  );
}
