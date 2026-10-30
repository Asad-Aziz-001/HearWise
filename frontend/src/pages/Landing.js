import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Headphones, Brain, TrendingUp, Sparkles, ArrowRight,
  ShieldCheck, Zap, BarChart3, Gamepad2, Target, Award,
  Mic, Music, BookOpen, Smile, Waves, Link as LinkIcon,
  MapPin, Repeat, Play, CheckCircle, Users, Menu, X
} from 'lucide-react';
import HeroIllustration from '../components/HeroIllustration';
import { getUser } from '../utils/auth';

const featuredGames = [
  { icon: Headphones, name: 'Similar Sounds', color: '#1e6ef5', bg: '#eff6ff' },
  { icon: Brain, name: 'Sequence Memory', color: '#10b981', bg: '#f0fdf4' },
  { icon: Music, name: 'Tone Discrimination', color: '#a855f7', bg: '#f5f3ff' },
  { icon: Waves, name: 'Word in Noise', color: '#6366f1', bg: '#eef2ff' },
  { icon: Mic, name: 'Pronunciation', color: '#f97316', bg: '#fff7ed' },
  { icon: BookOpen, name: 'Audio Story', color: '#14b8a6', bg: '#f0fdfa' },
  { icon: Repeat, name: 'Rhyme Match', color: '#f59e0b', bg: '#fffbeb' },
  { icon: MapPin, name: 'Word Position', color: '#0ea5e9', bg: '#f0f9ff' },
  { icon: LinkIcon, name: 'Word Chain', color: '#8b5cf6', bg: '#faf5ff' },
  { icon: Sparkles, name: 'Phoneme', color: '#ec4899', bg: '#fdf2f8' },
  { icon: Smile, name: 'Emotion Detection', color: '#eab308', bg: '#fefce8' },
];

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Learning',
    description: 'Dynamic game generation with real-time text-to-speech. Every session is unique.',
    color: '#a855f7',
  },
  {
    icon: Target,
    title: 'Adaptive Difficulty',
    description: 'Smart algorithm adjusts to your level based on accuracy and response time.',
    color: '#10b981',
  },
  {
    icon: BarChart3,
    title: 'Detailed Analytics',
    description: 'Track accuracy, weak contrasts, response times, and progress over time.',
    color: '#1e6ef5',
  },
  {
    icon: Award,
    title: '11 Game Modes',
    description: 'From tone discrimination to emotion detection — practice every listening skill.',
    color: '#f59e0b',
  },
  {
    icon: Zap,
    title: 'Instant Feedback',
    description: 'AI auto-tests every answer. Get feedback within milliseconds.',
    color: '#ec4899',
  },
  {
    icon: ShieldCheck,
    title: 'Practice, Not Diagnosis',
    description: 'Supportive practice tool — not a clinical APD assessment.',
    color: '#06b6d4',
  },
];

const steps = [
  {
    icon: Users,
    number: 1,
    title: 'Create Account',
    description: 'Sign up in seconds with just email and password.',
    color: '#1e6ef5',
  },
  {
    icon: Gamepad2,
    number: 2,
    title: 'Pick a Game',
    description: 'Choose from 11 AI-powered listening games.',
    color: '#a855f7',
  },
  {
    icon: Headphones,
    number: 3,
    title: 'Listen & Practice',
    description: 'Hear fresh audio, answer, get instant AI feedback.',
    color: '#10b981',
  },
  {
    icon: TrendingUp,
    number: 4,
    title: 'Track Progress',
    description: 'See accuracy charts, weak areas, and AI predictions.',
    color: '#f59e0b',
  },
];

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'About', href: '#about' },
  { label: 'Games', href: '#games' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
];

export default function Landing() {
  const user = getUser();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Update active section
      const sections = ['home', 'about', 'games', 'features', 'how-it-works'];
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top <= 100) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ background: 'white', minHeight: '100vh', overflow: 'hidden' }}>
      {/* ============ NAVBAR ============ */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: scrolled ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'all 0.3s ease',
        borderBottom: scrolled ? '1px solid rgba(16, 42, 86, 0.06)' : 'none',
        padding: '14px 0',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 14px rgba(30, 110, 245, 0.3)',
            }}>
              <Headphones size={22} />
            </div>
            <span style={{
              fontSize: 22,
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'Manrope, sans-serif',
            }}>
              HearWise
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="desktop-nav" style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
          }}>
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                style={{
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: activeSection === link.href.replace('#', '') ? 700 : 500,
                  color: activeSection === link.href.replace('#', '') ? '#1e6ef5' : '#5a6b8c',
                  textDecoration: 'none',
                  borderRadius: 8,
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
              >
                {link.label}
                {activeSection === link.href.replace('#', '') && (
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    left: 16,
                    right: 16,
                    height: 2,
                    background: '#1e6ef5',
                    borderRadius: 1,
                  }} />
                )}
              </a>
            ))}
          </div>

          {/* Right Side */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {user ? (
              <Link
                to="/dashboard"
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                  color: 'white',
                  fontWeight: 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  borderRadius: 10,
                  boxShadow: '0 4px 14px rgba(30, 110, 245, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Gamepad2 size={16} /> Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-login"
                  style={{
                    padding: '10px 20px',
                    color: '#1e6ef5',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    borderRadius: 10,
                    border: '2px solid #1e6ef5',
                  }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-register"
                  style={{
                    padding: '10px 22px',
                    background: 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    borderRadius: 10,
                    boxShadow: '0 4px 14px rgba(30, 110, 245, 0.35)',
                  }}
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile menu toggle */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileMenu(!mobileMenu)}
              style={{
                display: 'none',
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'white',
                border: '1px solid #e8f0fe',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#102a56',
              }}
            >
              {mobileMenu ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              background: 'white',
              borderTop: '1px solid #e8f0fe',
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenu(false)}
                style={{
                  padding: '12px 16px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#102a56',
                  textDecoration: 'none',
                  borderRadius: 8,
                }}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <section
        id="home"
        style={{
          padding: '140px 24px 80px',
          background: 'linear-gradient(180deg, #f5f9ff 0%, #e8f0fe 50%, #ffffff 100%)',
          position: 'relative',
        }}
      >
        <div
          className="hero-grid"
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 60,
            alignItems: 'center',
          }}
        >
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: 'white',
              border: '1px solid #e0e7ff',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              color: '#1e6ef5',
              marginBottom: 24,
              boxShadow: '0 2px 10px rgba(30, 110, 245, 0.1)',
            }}>
              <Sparkles size={14} /> 11 AI-Powered Listening Games
            </div>

            <h1 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#102a56',
              marginBottom: 24,
            }}>
              Better Listening
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Builds Brighter Futures
              </span>
            </h1>

            <p style={{
              fontSize: 17,
              color: '#5a6b8c',
              lineHeight: 1.7,
              marginBottom: 32,
              maxWidth: 500,
            }}>
              Practice auditory listening with <strong style={{ color: '#102a56' }}>11 AI-generated games</strong>.
              Fresh audio every session. Adaptive difficulty. Real-time feedback.
            </p>

            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
              <Link
                to={user ? '/dashboard' : '/register'}
                style={{
                  padding: '16px 32px',
                  background: 'linear-gradient(135deg, #1e6ef5, #1554c9)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 8px 24px rgba(30, 110, 245, 0.35)',
                }}
              >
                {user ? 'Continue Practicing' : 'Start Practicing Free'} <ArrowRight size={18} />
              </Link>
              <a
                href="#games"
                style={{
                  padding: '16px 32px',
                  background: 'white',
                  color: '#1e6ef5',
                  fontWeight: 700,
                  fontSize: 16,
                  textDecoration: 'none',
                  borderRadius: 12,
                  border: '2px solid #1e6ef5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Play size={18} /> See Games
              </a>
            </div>

            {/* Trust indicators */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {[
                { icon: CheckCircle, text: 'No credit card' },
                { icon: Zap, text: 'Instant access' },
                { icon: ShieldCheck, text: 'Privacy first' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5a6b8c' }}>
                  <item.icon size={14} color="#10b981" />
                  {item.text}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Girl Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
          >
            <HeroIllustration size={520} />
          </motion.div>
        </div>
      </section>

      {/* ============ ABOUT SECTION ============ */}
      <section id="about" style={{
        padding: '80px 24px',
        background: 'white',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div style={{
              display: 'inline-block',
              padding: '6px 16px',
              background: '#eff6ff',
              color: '#1e6ef5',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 20,
            }}>
              About HearWise
            </div>
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#102a56',
              marginBottom: 20,
            }}>
              Modern Auditory Training,<br />Powered by AI
            </h2>
            <p style={{ fontSize: 17, color: '#5a6b8c', lineHeight: 1.8, marginBottom: 16 }}>
              HearWise is an adaptive, game-based auditory listening practice platform. 
              It uses <strong style={{ color: '#102a56' }}>AI to generate fresh games</strong> every session — 
              with real-time TTS audio, adaptive difficulty, and detailed performance analytics.
            </p>
            <p style={{ fontSize: 15, color: '#8a9ab5', lineHeight: 1.7 }}>
              ⚠️ This is a practice tool, not a clinical assessment. 
              It does not diagnose Auditory Processing Disorder (APD).
            </p>
          </motion.div>
        </div>
      </section>

      {/* ============ GAMES SHOWCASE (4/4/3) ============ */}
      <section id="games" style={{ padding: '80px 24px', background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#102a56',
              marginBottom: 12,
            }}>
              11 Games. Every Listening Skill.
            </h2>
            <p style={{ fontSize: 16, color: '#5a6b8c', maxWidth: 600, margin: '0 auto' }}>
              From basic sound discrimination to advanced emotion detection.
            </p>
          </motion.div>

          {/* Row 1: First 4 games */}
          <div className="games-row games-row-4" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 16,
          }}>
            {featuredGames.slice(0, 4).map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                style={{
                  padding: 20,
                  background: game.bg,
                  borderRadius: 16,
                  border: '1px solid rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: game.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: `0 4px 12px ${game.color}40`,
                }}>
                  <game.icon size={24} />
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#102a56',
                  fontFamily: 'Manrope, sans-serif',
                }}>
                  {game.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 2: Next 4 games */}
          <div className="games-row games-row-4" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 16,
          }}>
            {featuredGames.slice(4, 8).map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                style={{
                  padding: 20,
                  background: game.bg,
                  borderRadius: 16,
                  border: '1px solid rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: game.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: `0 4px 12px ${game.color}40`,
                }}>
                  <game.icon size={24} />
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#102a56',
                  fontFamily: 'Manrope, sans-serif',
                }}>
                  {game.name}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 3: Last 3 games (centered) */}
          <div className="games-row games-row-3" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            maxWidth: 'calc(75% + 20px)',
            margin: '0 auto',
          }}>
            {featuredGames.slice(8, 11).map((game, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4, boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                style={{
                  padding: 20,
                  background: game.bg,
                  borderRadius: 16,
                  border: '1px solid rgba(0,0,0,0.05)',
                  textAlign: 'center',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: game.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  boxShadow: `0 4px 12px ${game.color}40`,
                }}>
                  <game.icon size={24} />
                </div>
                <div style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#102a56',
                  fontFamily: 'Manrope, sans-serif',
                }}>
                  {game.name}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="features" style={{
        padding: '80px 24px',
        background: 'white',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#102a56',
              marginBottom: 12,
            }}>
              Why HearWise?
            </h2>
            <p style={{ fontSize: 16, color: '#5a6b8c', maxWidth: 600, margin: '0 auto' }}>
              Built with modern AI, designed for real results.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
          }}>
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                style={{
                  padding: 32,
                  background: 'white',
                  borderRadius: 20,
                  border: '1px solid #e8f0fe',
                  boxShadow: '0 4px 20px rgba(16, 42, 86, 0.06)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `${feature.color}15`,
                  color: feature.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <feature.icon size={28} />
                </div>
                <h3 style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#102a56',
                  marginBottom: 10,
                }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: 15, color: '#5a6b8c', lineHeight: 1.6 }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" style={{
        padding: '80px 24px',
        background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              color: '#102a56',
              marginBottom: 12,
            }}>
              How It Works
            </h2>
            <p style={{ fontSize: 16, color: '#5a6b8c', maxWidth: 600, margin: '0 auto' }}>
              Get started in 4 simple steps.
            </p>
          </motion.div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 24,
          }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 20 }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: `${step.color}15`,
                    color: step.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                  }}>
                    <step.icon size={36} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: step.color,
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 14,
                    boxShadow: `0 4px 12px ${step.color}50`,
                    border: '3px solid white',
                  }}>
                    {step.number}
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: '#102a56',
                  marginBottom: 8,
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 14, color: '#5a6b8c', lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ padding: '80px 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '60px 40px',
            borderRadius: 24,
            background: 'linear-gradient(135deg, #1e6ef5 0%, #a855f7 100%)',
            color: 'white',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(30, 110, 245, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: -80,
            left: -80,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
              fontWeight: 800,
              marginBottom: 16,
            }}>
              Ready to Sharpen Your Listening?
            </h2>
            <p style={{ fontSize: 17, opacity: 0.95, marginBottom: 32, maxWidth: 600, margin: '0 auto 32px' }}>
              Join HearWise and practice with AI-generated audio, adaptive difficulty, and real-time analytics.
            </p>
            <Link
              to={user ? '/dashboard' : '/register'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '16px 40px',
                background: 'white',
                color: '#1e6ef5',
                fontWeight: 700,
                fontSize: 16,
                textDecoration: 'none',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              }}
            >
              {user ? 'Continue Practicing' : 'Create Free Account'} <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{
        padding: '40px 24px',
        borderTop: '1px solid #e8f0fe',
        background: 'white',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 24,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #1e6ef5, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}>
              <Headphones size={18} />
            </div>
            <div>
              <div style={{
                fontWeight: 800,
                fontSize: 16,
                color: '#102a56',
                fontFamily: 'Manrope, sans-serif',
              }}>
                HearWise
              </div>
              <div style={{ fontSize: 11, color: '#8a9ab5' }}>
                Better Listening Builds Brighter Futures
              </div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: '#8a9ab5' }}>
            © 2026 HearWise · Practice tool
          </div>
        </div>
      </footer>

      {/* ============ RESPONSIVE CSS ============ */}
      <style>{`
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .games-row-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .games-row-3 {
            grid-template-columns: repeat(2, 1fr) !important;
            max-width: 100% !important;
          }
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }

        @media (max-width: 640px) {
          .games-row-4,
          .games-row-3 {
            grid-template-columns: 1fr !important;
          }
          .btn-login {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}