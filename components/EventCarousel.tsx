import React, { useRef } from 'react';
import { GameEvent } from '../types';
import { Play, Info } from 'lucide-react';

interface EventCarouselProps {
  events: GameEvent[];
  onSelectEvent: (event: GameEvent) => void;
}

const EventCarousel: React.FC<EventCarouselProps> = ({ events, onSelectEvent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full py-8 px-4 md:px-12 relative z-20">
      <h3 className="text-2xl font-cyber font-bold mb-6 flex items-center gap-2">
        <span className="w-2 h-8 bg-neon-pink inline-block rounded-sm"></span>
        LIVE MATCHES
      </h3>
      
      <div className="relative group">
        {/* Controls */}
        <button 
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-r from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          &lt;
        </button>
        <button 
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-30 w-12 bg-gradient-to-l from-black/80 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          &gt;
        </button>

        {/* List */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {events.map((evt) => (
            <div 
              key={evt.id}
              className="flex-none w-[300px] md:w-[400px] aspect-video relative rounded-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-300 border border-purple-900/50 hover:border-purple-500 shadow-lg group/card snap-center"
              onClick={() => onSelectEvent(evt)}
            >
              <img src={evt.image} alt={evt.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
              
              <div className="absolute bottom-0 left-0 p-4 w-full">
                <div className="flex justify-between items-end mb-2">
                   <h4 className="font-cyber font-bold text-white text-lg">{evt.title}</h4>
                   <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>
                </div>
                <div className="text-xs font-ui text-gray-300 mb-3">{evt.game}</div>
                
                <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity transform translate-y-4 group-hover/card:translate-y-0">
                  <button className="flex-1 bg-white text-black py-1.5 px-3 rounded flex items-center justify-center gap-1 font-bold text-xs hover:bg-gray-200">
                    <Play size={14} /> WATCH
                  </button>
                  <button className="bg-gray-700/80 text-white p-1.5 rounded hover:bg-gray-600">
                    <Info size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventCarousel;
