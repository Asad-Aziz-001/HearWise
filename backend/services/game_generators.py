"""
Game Generators for HearWise — Complete Final Implementation
============================================================
All 11 games with:
- Massive word database (500+ words)
- Anti-repeat system
- Cached TTS (no repeat generation)
- Parallel TTS generation (fast)
- Retry + fallback for TTS failures
- No preload (generates on-demand)
"""

import os
import random
import hashlib
import time
import wave
import subprocess
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
from gtts import gTTS
import numpy as np

# ✅ Import massive database
from services.word_database import (
    MINIMAL_PAIRS, SINGLE_WORDS_BIG, SENTENCES_BIG,
    RHYME_PAIRS_BIG, NON_RHYME_BIG, EMOTIONS_BIG, PHONEMES_BIG
)
from services.word_history import word_history

# ✅ Fresh random seed
random.seed(int(time.time() * 1000000) % 2**32)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, 'static', 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)


# ============================================================
# CONTENT READERS — Read from admin-managed database
# ============================================================

def _get_word_pairs_from_db(difficulty=None):
    """Get active word pairs from admin content."""
    try:
        from models.content import ContentWordPair
        query = ContentWordPair.query.filter_by(is_active=True)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        pairs = query.all()
        if not pairs:
            return None
        return [(p.word1, p.word2) for p in pairs]
    except Exception as e:
        print(f"⚠️ _get_word_pairs_from_db: {e}")
        return None


def _get_sentences_from_db(difficulty=None):
    """Get active sentences from admin content."""
    try:
        from models.content import ContentSentence
        query = ContentSentence.query.filter_by(is_active=True)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        sentences = query.all()
        if not sentences:
            return None
        return [s.text for s in sentences]
    except Exception as e:
        print(f"⚠️ _get_sentences_from_db: {e}")
        return None


def _get_emotions_from_db():
    """Get active emotion sentences from admin content."""
    try:
        from models.content import ContentEmotion
        emotions = ContentEmotion.query.filter_by(is_active=True).all()
        if not emotions:
            return None
        return [{'text': e.text, 'emotion': e.emotion} for e in emotions]
    except Exception as e:
        print(f"⚠️ _get_emotions_from_db: {e}")
        return None


def _get_phonemes_from_db(difficulty=None):
    """Get active phoneme transformations from admin content."""
    try:
        from models.content import ContentPhoneme
        query = ContentPhoneme.query.filter_by(is_active=True)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        phonemes = query.all()
        if not phonemes:
            return None
        return [
            {'original': p.original_word, 'new': p.new_word, 'change': p.sound_change or ''}
            for p in phonemes
        ]
    except Exception as e:
        print(f"⚠️ _get_phonemes_from_db: {e}")
        return None


def _get_rhyme_pairs_from_db():
    """Get active rhyme pairs from admin content."""
    try:
        from models.content import ContentRhymePair
        pairs = ContentRhymePair.query.filter_by(is_active=True).all()
        if not pairs:
            return None
        return [(p.word1, p.word2) for p in pairs]
    except Exception as e:
        print(f"⚠️ _get_rhyme_pairs_from_db: {e}")
        return None


def _get_word_chains_from_db(difficulty=None):
    """Get active word chains from admin content."""
    import json
    try:
        from models.content import ContentWordChain
        query = ContentWordChain.query.filter_by(is_active=True)
        if difficulty:
            query = query.filter_by(difficulty=difficulty)
        chains = query.all()
        if not chains:
            return None
        result = []
        for c in chains:
            try:
                words = json.loads(c.words) if c.words.startswith('[') else c.words.split(',')
                result.append([w.strip() for w in words])
            except:
                continue
        return result if result else None
    except Exception as e:
        print(f"⚠️ _get_word_chains_from_db: {e}")
        return None


# ============================================================
# TTS HELPER — Cached, Retry, Fallback
# ============================================================

def _create_silent_audio(filename_base):
    """Create a silent audio file as fallback."""
    filepath = os.path.join(AUDIO_DIR, filename_base.replace('.mp3', '.wav'))
    
    sample_rate = 44100
    duration = 0.5
    silence = b'\x00\x00' * int(sample_rate * duration)
    
    with wave.open(filepath, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(silence)
    
    return os.path.basename(filepath)


def _generate_audio(word):
    """
    Cached TTS generation with retry and fallback.
    - If cached: return immediately (no network call)
    - If not: generate with gTTS (2 retries)
    - If fail: return silent audio
    """
    safe = word.lower().strip().replace(' ', '_').replace('/', '_').replace("'", '')
    hash_part = hashlib.md5(word.encode()).hexdigest()[:6]
    filename = f"ai_{safe}_{hash_part}.mp3"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    # ✅ Cache hit — return immediately
    if os.path.exists(filepath):
        return filename
    
    # ✅ Try gTTS with retries
    for attempt in range(2):
        try:
            tts = gTTS(text=word, lang='en', slow=False)
            tts.save(filepath)
            return filename
        except Exception as e:
            print(f"⚠️ TTS attempt {attempt+1} failed for '{word}': {e}")
            if attempt == 0:
                time.sleep(0.3)
    
    # ✅ Fallback: silent audio
    print(f"❌ TTS failed for '{word}' — using silent audio")
    return _create_silent_audio(filename)


def _generate_audio_batch(words):
    """Generate multiple TTS in parallel."""
    with ThreadPoolExecutor(max_workers=5) as executor:
        return list(executor.map(_generate_audio, words))


def _generate_tone_wav(frequency, q_idx, tone_label):
    """Generate pure sine tone WAV file."""
    safe_freq = round(frequency)
    filename = f"tone_{safe_freq}hz_{q_idx}_{tone_label}_{int(time.time()*1000) % 100000}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)
    
    duration = 0.6
    sample_rate = 44100
    t = np.linspace(0, duration, int(sample_rate * duration))
    wave_data = 0.3 * np.sin(2 * np.pi * frequency * t)
    
    fade = int(0.05 * sample_rate)
    wave_data[:fade] *= np.linspace(0, 1, fade)
    wave_data[-fade:] *= np.linspace(1, 0, fade)
    
    audio_int16 = (wave_data * 32767).astype(np.int16)
    
    with wave.open(filepath, 'wb') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())
    
    return filename


# ============================================================
# UNIQUE PICKERS (Anti-repeat)
# ============================================================

def _pick_unique_words(pool, count, user_id, game_type):
    """Pick words avoiding recent repeats."""
    pool_copy = list(pool)
    random.shuffle(pool_copy)
    picked = []
    for word in pool_copy:
        key = str(word)
        if not word_history.is_recent(user_id, game_type, key):
            picked.append(word)
            word_history.add(user_id, game_type, key)
            if len(picked) >= count:
                break
    if len(picked) < count:
        remaining = [w for w in pool_copy if w not in picked]
        random.shuffle(remaining)
        picked.extend(remaining[:count - len(picked)])
    return picked


def _pick_unique_pairs(pair_pool, count, user_id, game_type):
    """Pick pairs avoiding recent repeats."""
    pool_copy = list(pair_pool)
    random.shuffle(pool_copy)
    picked = []
    for pair in pool_copy:
        key = f"{pair[0]}_{pair[1]}"
        if not word_history.is_recent(user_id, game_type, key):
            picked.append(pair)
            word_history.add(user_id, game_type, key)
            if len(picked) >= count:
                break
    if len(picked) < count:
        remaining = [p for p in pool_copy if p not in picked]
        random.shuffle(remaining)
        picked.extend(remaining[:count - len(picked)])
    return picked


# ============================================================
# GAME 1: SIMILAR SOUNDING WORDS
# ============================================================

def generate_similar_words(user_id, difficulty='easy', question_count=10):
    """Similar-sounding word discrimination."""
    
    # ✅ Try admin content first
    db_pairs = _get_word_pairs_from_db(difficulty)
    
    if db_pairs:
        all_pairs = db_pairs
    else:
        # Fallback to hardcoded
        all_pairs = []
        for contrast_pairs in MINIMAL_PAIRS.values():
            all_pairs.extend(contrast_pairs)
    
    selected = _pick_unique_pairs(all_pairs, question_count, user_id, 'similar')
    
    questions = []
    for i, pair in enumerate(selected):
        audios = _generate_audio_batch([pair[0], pair[1]])
        audio1, audio2 = audios[0], audios[1]
        
        if random.random() < 0.5:
            correct = 'a'
            play_audio = audio1
        else:
            correct = 'b'
            play_audio = audio2
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'similar',
            'option_a': pair[0],
            'option_b': pair[1],
            'audio_a': audio1,
            'audio_b': audio2,
            'play_audio': play_audio,
            'correct': correct,
            'from_admin_content': bool(db_pairs),
        })
    
    return {
        'game_type': 'word_discrimination',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'Admin Content' if db_pairs else 'AI (Default)',
    }

# ============================================================
# GAME 2: SEQUENCE MEMORY
# ============================================================

def generate_sequence_game(user_id, difficulty='easy', question_count=5):
    """Auditory sequence memory game."""
    seq_len = {'easy': 3, 'medium': 4, 'hard': 5}.get(difficulty, 3)
    
    questions = []
    for i in range(question_count):
        words = _pick_unique_words(SINGLE_WORDS_BIG, seq_len, user_id, f'seq_{i}')
        
        # ✅ Parallel TTS
        audios = _generate_audio_batch(words)
        
        correct_order = words[:]
        
        wrong = []
        attempts = 0
        while len(wrong) < 3 and attempts < 50:
            attempts += 1
            p = words[:]
            random.shuffle(p)
            if p != correct_order and p not in wrong:
                wrong.append(p)
        
        options = [correct_order] + wrong
        random.shuffle(options)
        correct_idx = options.index(correct_order)
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'sequence',
            'sequence': words,
            'audios': audios,
            'options': options,
            'correct': correct_idx,
        })
    
    return {
        'game_type': 'sequence_memory',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Sequence)',
    }


# ============================================================
# GAME 3: WORD IN NOISE
# ============================================================

def generate_word_in_noise(user_id, difficulty='easy', question_count=6):
    """Words mixed with background noise."""
    all_pairs = []
    for contrast_pairs in MINIMAL_PAIRS.values():
        all_pairs.extend(contrast_pairs)
    
    selected = _pick_unique_pairs(all_pairs, question_count, user_id, 'noise')
    snr_db = {'easy': 20, 'medium': 12, 'hard': 6}.get(difficulty, 12)
    
    questions = []
    for i, pair in enumerate(selected):
        correct_word = random.choice(pair)
        clean_file = _generate_audio(correct_word)
        
        # Try noise mixing
        noisy_filename = clean_file
        try:
            clean_path = os.path.join(AUDIO_DIR, clean_file)
            temp_wav = os.path.join(AUDIO_DIR, f"temp_{i}_{int(time.time()*1000)}.wav")
            
            subprocess.run([
                'ffmpeg', '-y', '-i', clean_path,
                '-acodec', 'pcm_s16le', '-ar', '44100', '-ac', '1',
                temp_wav
            ], capture_output=True, timeout=10)
            
            if os.path.exists(temp_wav):
                with wave.open(temp_wav, 'rb') as wf:
                    fr = wf.getframerate()
                    n = wf.getnframes()
                    data = wf.readframes(n)
                
                samples = np.frombuffer(data, dtype=np.int16).astype(np.float32)
                noise = np.random.normal(0, 1, len(samples)).astype(np.float32)
                
                clean_rms = np.sqrt(np.mean(samples ** 2)) or 1
                noise_rms = np.sqrt(np.mean(noise ** 2)) or 1
                target = clean_rms / (10 ** (snr_db / 20))
                noise_scaled = noise * (target / noise_rms)
                
                mixed = np.clip(samples + noise_scaled, -32768, 32767).astype(np.int16)
                
                noisy_filename = f"ai_noisy_{correct_word}_{i}_{int(time.time()*1000)%100000}.wav"
                noisy_path = os.path.join(AUDIO_DIR, noisy_filename)
                
                with wave.open(noisy_path, 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(fr)
                    wf.writeframes(mixed.tobytes())
                
                os.remove(temp_wav)
        except Exception as e:
            print(f"⚠️ Noise mixing failed: {e}")
            noisy_filename = clean_file
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'word_in_noise',
            'word_a': pair[0],
            'word_b': pair[1],
            'play_audio': noisy_filename,
            'correct': 'a' if correct_word == pair[0] else 'b',
            'snr_db': snr_db,
        })
    
    return {
        'game_type': 'word_in_noise',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Noise Mixing)',
    }


# ============================================================
# GAME 4: TONE DISCRIMINATION
# ============================================================

def generate_tone_discrimination(user_id, difficulty='easy', question_count=8):
    """Same vs different tone frequencies."""
    diff_hz = {'easy': 50, 'medium': 20, 'hard': 8}.get(difficulty, 20)
    
    questions = []
    for i in range(question_count):
        base_freq = random.randint(300, 800)
        same = random.random() < 0.5
        
        freq1 = base_freq + random.randint(-50, 50)
        freq2 = freq1 if same else freq1 + random.choice([-1, 1]) * diff_hz
        
        tone1 = _generate_tone_wav(freq1, i, 'a')
        tone2 = _generate_tone_wav(freq2, i, 'b')
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'tone',
            'freq_a': freq1,
            'freq_b': freq2,
            'audio_a': tone1,
            'audio_b': tone2,
            'correct': 'same' if same else 'different',
        })
    
    return {
        'game_type': 'tone_discrimination',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Random Tones)',
    }


# ============================================================
# GAME 5: WORD POSITION DETECTION
# ============================================================

def generate_word_position(user_id, difficulty='easy', question_count=6):
    """Identify position of target word in sentence."""
    
    # ✅ Try admin content first
    db_sentences = _get_sentences_from_db(difficulty)
    
    if db_sentences:
        selected = _pick_unique_words(db_sentences, question_count, user_id, 'position')
    else:
        selected = _pick_unique_words(SENTENCES_BIG, question_count, user_id, 'position')
    
    questions = []
    for i, sentence in enumerate(selected):
        words = sentence.split()
        if len(words) < 3:
            continue
        
        target_idx = random.randint(1, len(words) - 2)
        target_word = words[target_idx]
        audio = _generate_audio(sentence)
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'word_position',
            'sentence': sentence,
            'target_word': target_word,
            'audio': audio,
            'correct': target_idx + 1,
            'word_count': len(words),
            'from_admin_content': bool(db_sentences),
        })
    
    return {
        'game_type': 'word_position',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'Admin Content' if db_sentences else 'AI (Default)',
    }

# ============================================================
# GAME 6: RHYME MATCH
# ============================================================

def generate_rhyme_match(user_id, difficulty='easy', question_count=6):
    """Pick 2 words that rhyme from 3 options."""
    
    # ✅ Try admin content first
    db_rhymes = _get_rhyme_pairs_from_db()
    
    if db_rhymes:
        pair_pool = db_rhymes
    else:
        pair_pool = RHYME_PAIRS_BIG
    
    selected_pairs = _pick_unique_pairs(pair_pool, question_count, user_id, 'rhyme')
    
    questions = []
    for i, pair in enumerate(selected_pairs):
        available_non_rhyme = [w for w in NON_RHYME_BIG if w not in pair]
        other = random.choice(available_non_rhyme)
        
        options = [pair[0], pair[1], other]
        random.shuffle(options)
        audios = _generate_audio_batch(options)
        
        correct_indices = sorted([
            idx for idx, w in enumerate(options) if w in pair
        ])
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'rhyme',
            'options': options,
            'audios': audios,
            'correct': correct_indices,
            'from_admin_content': bool(db_rhymes),
        })
    
    return {
        'game_type': 'rhyme_match',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'Admin Content' if db_rhymes else 'AI (Default)',
    }


# ============================================================
# GAME 7: WORD CHAIN MEMORY
# ============================================================

def generate_word_chain(user_id, difficulty='easy', question_count=6):
    """Remember last word of a chain."""
    chain_length = {'easy': 3, 'medium': 5, 'hard': 7}.get(difficulty, 3)
    
    questions = []
    for i in range(question_count):
        chain = _pick_unique_words(SINGLE_WORDS_BIG, chain_length, user_id, f'chain_{i}')
        last_word = chain[-1]
        
        # ✅ Parallel TTS (chain words)
        audios = _generate_audio_batch(chain)
        
        distractors = _pick_unique_words(
            [w for w in SINGLE_WORDS_BIG if w != last_word],
            3, user_id, f'chain_dist_{i}'
        )
        
        options = [last_word] + distractors
        random.shuffle(options)
        correct_idx = options.index(last_word)
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'word_chain',
            'chain': chain,
            'audios': audios,
            'options': options,
            'correct': correct_idx,
            'length': chain_length,
        })
    
    return {
        'game_type': 'word_chain_memory',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Chain)',
    }


# ============================================================
# GAME 8: PHONEME REPLACEMENT
# ============================================================

def generate_phoneme_replacement(user_id, difficulty='easy', question_count=6):
    """Identify what happens when a phoneme changes."""
    
    # ✅ Try admin content first
    db_phonemes = _get_phonemes_from_db(difficulty)
    
    if db_phonemes:
        selected = _pick_unique_words(db_phonemes, question_count, user_id, 'phoneme')
    else:
        selected = _pick_unique_words(PHONEMES_BIG, question_count, user_id, 'phoneme')
    
    questions = []
    for i, t in enumerate(selected):
        audios = _generate_audio_batch([t['original'], t['new']])
        original_audio, new_audio = audios[0], audios[1]
        
        other_words = [x.get('new') or x[1] for x in (db_phonemes or PHONEMES_BIG) if x.get('new', x[1] if isinstance(x, tuple) else '') != t['new']]
        random.shuffle(other_words)
        distractors = other_words[:3]
        
        options = [t['new']] + distractors
        random.shuffle(options)
        correct_idx = options.index(t['new'])
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'phoneme',
            'original': t['original'],
            'change': t.get('change', t.get('sound_change', '')),
            'original_audio': original_audio,
            'new_audio': new_audio,
            'options': options,
            'correct': correct_idx,
            'from_admin_content': bool(db_phonemes),
        })
    
    return {
        'game_type': 'phoneme_replacement',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'Admin Content' if db_phonemes else 'AI (Default)',
    }


# ============================================================
# GAME 9: AUDIO STORY COMPREHENSION
# ============================================================

def generate_audio_story(user_id, difficulty='easy', question_count=3):
    """Listen to story, answer comprehension questions."""
    selected = _pick_unique_words(SENTENCES_BIG, question_count, user_id, 'story')
    
    questions = []
    for i, sentence in enumerate(selected):
        words = sentence.split()
        if len(words) < 4:
            continue
        
        audio = _generate_audio(sentence)
        
        story_questions = []
        
        # Q1: "Which word was in the story?"
        target_idx = random.randint(1, len(words) - 1)
        target = words[target_idx]
        
        distractors_pool = [w for w in SINGLE_WORDS_BIG if w.lower() not in [x.lower() for x in words]]
        random.shuffle(distractors_pool)
        q1_options = [target] + distractors_pool[:3]
        random.shuffle(q1_options)
        q1_correct = q1_options.index(target)
        
        story_questions.append({
            'q': 'Which word was in the story?',
            'options': q1_options,
            'correct': q1_correct,
        })
        
        # Q2: "How many words were in the story?"
        word_count = len(words)
        count_options = [word_count, word_count + 2, word_count - 1, word_count + 4]
        count_options = list(set(count_options))[:4]
        while len(count_options) < 4:
            new_num = word_count + random.randint(-3, 5)
            if new_num > 0 and new_num not in count_options:
                count_options.append(new_num)
        random.shuffle(count_options)
        q2_correct = count_options.index(word_count)
        
        story_questions.append({
            'q': 'How many words were in the story?',
            'options': [str(n) for n in count_options],
            'correct': q2_correct,
        })
        
        # Q3: "What was the FIRST word?"
        first_word = words[0]
        q3_distractors = [w for w in SINGLE_WORDS_BIG if w.lower() not in [x.lower() for x in words]]
        random.shuffle(q3_distractors)
        q3_options = [first_word] + q3_distractors[:3]
        random.shuffle(q3_options)
        q3_correct = q3_options.index(first_word)
        
        story_questions.append({
            'q': 'What was the FIRST word of the story?',
            'options': q3_options,
            'correct': q3_correct,
        })
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'audio_story',
            'story_text': sentence,
            'audio': audio,
            'questions': story_questions,
            'correct_answers': [q['correct'] for q in story_questions],
        })
    
    return {
        'game_type': 'audio_story',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Story)',
    }


# ============================================================
# GAME 10: PRONUNCIATION SCORING
# ============================================================

def generate_pronunciation(user_id, difficulty='easy', question_count=5):
    """Speak words, get pronunciation score."""
    words = _pick_unique_words(SINGLE_WORDS_BIG, question_count, user_id, 'pronunciation')
    
    # ✅ Parallel TTS
    audios = _generate_audio_batch(words)
    
    questions = []
    for i, word in enumerate(words):
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'pronunciation',
            'word': word,
            'audio': audios[i],
            'correct': word,  # ✅ Required for auto-test
        })
    
    return {
        'game_type': 'pronunciation',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'AI (Pronunciation)',
    }


# ============================================================
# GAME 11: EMOTION DETECTION
# ============================================================

def generate_emotion_detection(user_id, difficulty='easy', question_count=5):
    """Identify emotion in spoken sentence."""
    
    # ✅ Try admin content first
    db_emotions = _get_emotions_from_db()
    
    if db_emotions:
        selected = _pick_unique_words(db_emotions, question_count, user_id, 'emotion')
    else:
        selected = _pick_unique_words(EMOTIONS_BIG, question_count, user_id, 'emotion')
    
    questions = []
    for i, entry in enumerate(selected):
        audio = _generate_audio(entry['text'])
        options = ['happy', 'sad', 'angry', 'neutral']
        correct_idx = options.index(entry['emotion'])
        
        questions.append({
            'question_id': i + 1,
            'ai_generated': True,
            'type': 'emotion',
            'text': entry['text'],
            'audio': audio,
            'options': options,
            'correct': correct_idx,
            'emotion': entry['emotion'],
            'from_admin_content': bool(db_emotions),
        })
    
    return {
        'game_type': 'emotion_detection',
        'difficulty': difficulty,
        'total_questions': len(questions),
        'questions': questions,
        'generated_by': 'Admin Content' if db_emotions else 'AI (Default)',
    }

# ============================================================
# AUTO TEST — Generic for all games
# ============================================================

def auto_test_generic(questions, user_answers, game_type):
    """Universal auto-test for all 11 games."""
    from difflib import SequenceMatcher
    
    results = []
    correct_count = 0
    total_answered = 0
    
    for q in questions:
        qid_str = str(q['question_id'])
        ua = user_answers.get(qid_str)
        
        # Audio story — multiple questions per story
        if game_type == 'audio_story':
            story_results = []
            story_correct = 0
            story_total = 0
            
            if isinstance(ua, list):
                for i, correct_ans in enumerate(q['correct_answers']):
                    user_ans = ua[i] if i < len(ua) else None
                    try:
                        user_int = int(user_ans) if user_ans is not None else None
                    except (ValueError, TypeError):
                        user_int = None
                    
                    is_correct = (user_int == correct_ans)
                    if is_correct:
                        story_correct += 1
                        correct_count += 1
                    story_total += 1
                    total_answered += 1
                    
                    story_results.append({
                        'q_index': i,
                        'user_answer': user_int,
                        'correct_answer': correct_ans,
                        'is_correct': is_correct,
                    })
            
            results.append({
                'question_id': q['question_id'],
                'story_text': q.get('story_text', ''),
                'story_results': story_results,
                'correct': story_correct,
                'total': story_total,
            })
            continue
        
        ca = q.get('correct')
        is_correct = False
        score = 0
        
        if game_type == 'pronunciation':
            if ua and ca:
                ua_str = str(ua).lower().strip()
                ca_str = str(ca).lower().strip()
                similarity = SequenceMatcher(None, ua_str, ca_str).ratio()
                score = round(similarity * 100)
                is_correct = score >= 70
            results.append({
                'question_id': q['question_id'],
                'spoken': ua,
                'expected': ca,
                'score': score,
                'is_correct': is_correct,
            })
        
        elif game_type == 'rhyme_match':
            if isinstance(ua, list) and isinstance(ca, list):
                is_correct = sorted(ua) == sorted(ca)
            results.append({
                'question_id': q['question_id'],
                'user_answer': ua,
                'correct_answer': ca,
                'is_correct': is_correct,
            })
        
        elif game_type in ['word_position', 'word_chain_memory',
                           'phoneme_replacement', 'emotion_detection',
                           'sequence_memory']:
            try:
                ua_int = int(ua) if ua is not None else None
                ca_int = int(ca) if ca is not None else None
                is_correct = (ua_int == ca_int)
            except (ValueError, TypeError):
                is_correct = False
            results.append({
                'question_id': q['question_id'],
                'user_answer': ua,
                'correct_answer': ca,
                'is_correct': is_correct,
            })
        
        else:
            # Default: string comparison (similar, tone, word_in_noise)
            is_correct = str(ua).lower() == str(ca).lower()
            results.append({
                'question_id': q['question_id'],
                'user_answer': ua,
                'correct_answer': ca,
                'is_correct': is_correct,
            })
        
        if is_correct:
            correct_count += 1
        total_answered += 1
    
    accuracy = (correct_count / total_answered * 100) if total_answered else 0
    
    if accuracy >= 80:
        feedback = '🌟 Excellent performance!'
    elif accuracy >= 60:
        feedback = '👍 Good progress!'
    else:
        feedback = '⚠️ Keep practicing!'
    
    return {
        'accuracy': round(accuracy, 1),
        'correct': correct_count,
        'total': total_answered,
        'results': results,
        'ai_feedback': feedback,
    }