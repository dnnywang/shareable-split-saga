
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EmojiPickerProps {
  selectedEmoji: string;
  onEmojiSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES = {
  'Faces': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰'],
  'Animals': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'],
  'Food': ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅'],
  'Travel': ['✈️', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛵'],
  'Activities': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🥊', '🥋', '⛳', '🎣'],
  'Objects': ['💼', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🧮'],
};

const EmojiPicker = ({ selectedEmoji, onEmojiSelect }: EmojiPickerProps) => {
  const [category, setCategory] = useState<keyof typeof EMOJI_CATEGORIES>('Faces');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <span className="mr-2">{selectedEmoji}</span> Change Emoji
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3">
          <div className="flex overflow-x-auto gap-2 pb-2 mb-2">
            {Object.keys(EMOJI_CATEGORIES).map((cat) => (
              <Button
                key={cat}
                variant={cat === category ? "default" : "ghost"}
                size="sm"
                onClick={() => setCategory(cat as keyof typeof EMOJI_CATEGORIES)}
                className="whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-8 gap-1 max-h-[200px] overflow-y-auto">
            {EMOJI_CATEGORIES[category].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className={`text-xl p-1 h-auto ${selectedEmoji === emoji ? 'bg-accent' : ''}`}
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
