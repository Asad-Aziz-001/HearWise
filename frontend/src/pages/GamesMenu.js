import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Headphones, ListChecks, Music, Waves, BookOpen,
  MapPin, Link as LinkIcon, Repeat, Mic, Smile, Volume2,
  Sparkles, Play
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const categories = [
  {
    name: 'Listening Foundations',
    icon: Headphones,
    color: '#1e6ef5',
    games: [
      {
        id: 'similar',
        title: 'Similar-Sounding Words',
        description: 'Listen and choose the correct word from similar-sounding pairs.',
        icon: Headphones,
        color: 'purple',
        path: '/game/similar',
        badge: 'Classic',
      },
      {
        id: 'sequence',
        title: 'Auditory Sequence Memory',
        description: 'Remember the order of words in a spoken sequence.',
        icon: ListChecks,
        color: 'green',
        path: '/game/sequence',
        badge: 'Memory',
      },
    ],
  },
  {
    name: 'Audio Perception',
    icon: Waves,
    color: '#a855f7',
    games: [
      {
        id: 'tone',
        title: 'Tone Discrimination',
        description: 'Identify if two tones are the same or different frequency.',
        icon: Music,
        color: 'purple',
        path: '/game/tone',
        badge: 'Pitch',
      },
      {
        id: 'noise',
        title: 'Word in Noise',
        description: 'Identify words heard over background noise (rain, traffic, crowd).',
        icon: Volume2,
        color: 'blue',
        path: '/game/noise',
        badge: 'SNR',
      },
    ],
  },
  {
    name: 'Comprehension',
    icon: BookOpen,
    color: '#10b981',
    games: [
      {
        id: 'story',
        title: 'Audio Story Comprehension',
        description: 'Listen to short stories and answer questions.',
        icon: BookOpen,
        color: 'green',
        path: '/game/story',
        badge: 'Listen+Understand',
      },
      {
        id: 'position',
        title: 'Word Position Detection',
        description: 'Identify the position of a target word in a sentence.',
        icon: MapPin,
        color: 'blue',
        path: '/game/position',
        badge: 'Attention',
      },
      {
        id: 'chain',
        title: 'Word Chain Memory',
        description: 'Remember the last word in a spoken chain.',
        icon: LinkIcon,
        color: 'purple',
        path: '/game/chain',
        badge: 'Recall',
      },
    ],
  },
  {
    name: 'Speech & Phonetics',
    icon: Mic,
    color: '#f59e0b',
    games: [
      {
        id: 'rhyme',
        title: 'Rhyme Match',
        description: 'Identify which two words rhyme.',
        icon: Repeat,
        color: 'yellow',
        path: '/game/rhyme',
        badge: 'Rhythm',
      },
      {
        id: 'phoneme',
        title: 'Phoneme Replacement',
        description: 'What happens when one sound changes?',
        icon: Sparkles,
        color: 'purple',
        path: '/game/phoneme',
        badge: 'Phonics',
      },
      {
        id: 'pronunciation',
        title: 'Pronunciation Scoring',
        description: 'Speak words and get AI pronunciation scores.',
        icon: Mic,
        color: 'purple',
        path: '/game/pronunciation',
        badge: 'AI Voice',
      },
      {
        id: 'emotion',
        title: 'Emotion Detection',
        description: 'Identify emotion in spoken audio.',
        icon: Smile,
        color: 'yellow',
        path: '/game/emotion',
        badge: 'Paralinguistic',
      },
    ],
  },
];

const colorMap = {
  purple: { bg: 'linear-gradient(135deg, #a855f7, #7c3aed)', shadow: 'rgba(168, 85, 247, 0.35)', tint: '#f5f3ff', text: '#7c3aed' },
  green: { bg: 'linear-gradient(135deg, #34d399, #059669)', shadow: 'rgba(52, 211, 153, 0.35)', tint: '#f0fdf4', text: '#059669' },
  blue: { bg: 'linear-gradient(135deg, #60a5fa, #1e6ef5)', shadow: 'rgba(96, 165, 250, 0.35)', tint: '#eff6ff', text: '#1e6ef5' },
  yellow: { bg: 'linear-gradient(135deg, #fbbf24, #d97706)', shadow: 'rgba(251, 191, 36, 0.35)', tint: '#fef3c7', text: '#b45309' },
};

export default function GamesMenu() {
  const navigate = useNavigate();

  return (
    <div className="dash-layout">
      <Sidebar />
      <main className="dash-main">
        <div className="dash-topbar">
          <div>
            <h1 className="dash-greeting">Choose Your Game 🎮</h1>
            <p className="dash-subtext">11 AI-powered games across 4 categories — pick what you want to practice.</p>
          </div>
        </div>

        {categories.map((cat, ci) => (
          <div key={cat.name} style={{ marginBottom: 32 }}>
            {/* Category Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 16, paddingBottom: 8,
              borderBottom: '2px solid #e8f0fe',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: cat.color, color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <cat.icon size={20} />
              </div>
              <h2 style={{
                fontFamily: 'Manrope', fontSize: '1.2rem', fontWeight: 800,
                color: '#102a56', margin: 0,
              }}>
                {cat.name}
              </h2>
              <span style={{
                fontSize: 12, color: '#8a9ab5', marginLeft: 8,
              }}>
                ({cat.games.length} game{cat.games.length > 1 ? 's' : ''})
              </span>
            </div>

            {/* Games Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}>
              {cat.games.map((game, gi) => {
                const colors = colorMap[game.color] || colorMap.purple;
                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + gi * 0.05 }}
                    whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(16,42,86,0.12)' }}
                    onClick={() => navigate(game.path)}
                    style={{
                      background: 'white',
                      borderRadius: 16,
                      padding: 20,
                      border: '1px solid #e8f0fe',
                      boxShadow: '0 4px 12px rgba(16, 42, 86, 0.04)',
                      cursor: 'pointer',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Badge */}
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      padding: '3px 8px', borderRadius: 6,
                      fontSize: 9, fontWeight: 700,
                      background: colors.tint, color: colors.text,
                      textTransform: 'uppercase', letterSpacing: 0.3,
                    }}>
                      {game.badge}
                    </div>

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 14,
                      background: colors.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', marginBottom: 14,
                      boxShadow: `0 6px 16px ${colors.shadow}`,
                    }}>
                      <game.icon size={26} />
                    </div>

                    {/* Title */}
                    <h3 style={{
                      fontFamily: 'Manrope', fontSize: '1rem', fontWeight: 700,
                      color: '#102a56', marginBottom: 6,
                    }}>
                      {game.title}
                    </h3>

                    {/* Desc */}
                    <p style={{
                      fontSize: 12, color: '#5a6b8c',
                      lineHeight: 1.5, marginBottom: 14, flex: 1,
                    }}>
                      {game.description}
                    </p>

                    {/* Play Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(game.path);
                      }}
                      style={{
                        padding: '8px 16px',
                        background: colors.bg,
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        alignSelf: 'flex-start',
                        boxShadow: `0 4px 12px ${colors.shadow}`,
                      }}
                    >
                      <Play size={12} /> Play Now
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}