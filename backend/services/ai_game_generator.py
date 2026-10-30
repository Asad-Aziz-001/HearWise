"""
AI Game Generator — Real AI
============================
- Generates NEW word pairs dynamically
- Uses gTTS to generate fresh audio files on-the-fly
- Deep-analyzes user performance to pick the most-needed contrasts
- Supports both Similar-Sounding Words and Sequence Memory games
"""

import os
import random
import hashlib
from datetime import datetime
from gtts import gTTS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO_DIR = os.path.join(BASE_DIR, 'static', 'audio')
os.makedirs(AUDIO_DIR, exist_ok=True)


# Master knowledge base — AI selects pairs based on user's weak areas
KNOWLEDGE_BASE = {
    # Vowel contrasts
    'vowel': {
        '/ɪ/ vs /iː/': {
            'pairs': [('ship', 'sheep'), ('bit', 'beat'), ('sit', 'seat'),
                      ('fit', 'feet'), ('lip', 'leap'), ('bin', 'bean')],
            'difficulty': 'easy',
        },
        '/e/ vs /æ/': {
            'pairs': [('pen', 'pan'), ('bed', 'bad'), ('men', 'man'),
                      ('led', 'lad'), ('said', 'sad'), ('beg', 'bag')],
            'difficulty': 'medium',
        },
        '/ɪ/ vs /e/': {
            'pairs': [('pin', 'pen'), ('bit', 'bet'), ('sit', 'set'),
                      ('fill', 'fell'), ('lid', 'led'), ('pit', 'pet')],
            'difficulty': 'medium',
        },
        '/ʊ/ vs /uː/': {
            'pairs': [('pull', 'pool'), ('full', 'fool'), ('look', 'Luke'),
                      ('should', 'shoed'), ('wood', 'wooed')],
            'difficulty': 'hard',
        },
        '/æ/ vs /ʌ/': {
            'pairs': [('cat', 'cut'), ('bat', 'but'), ('ran', 'run'),
                      ('fan', 'fun'), ('hat', 'hut')],
            'difficulty': 'easy',
        },
    },
    # Consonant contrasts
    'consonant': {
        '/f/ vs /v/': {
            'pairs': [('fan', 'van'), ('fine', 'vine'), ('fat', 'vat'),
                      ('ferry', 'very'), ('fear', 'veer'), ('safe', 'save')],
            'difficulty': 'easy',
        },
        '/p/ vs /b/': {
            'pairs': [('pat', 'bat'), ('pin', 'bin'), ('pack', 'back'),
                      ('pear', 'bear'), ('pig', 'big'), ('cap', 'cab')],
            'difficulty': 'medium',
        },
        '/θ/ vs /f/': {
            'pairs': [('thin', 'fin'), ('three', 'free'), ('thought', 'fought'),
                      ('thick', 'fick'), ('mouth', 'mouse')],
            'difficulty': 'hard',
        },
        '/s/ vs /z/': {
            'pairs': [('sip', 'zip'), ('bus', 'buzz'), ('sue', 'zoo'),
                      ('rice', 'rise'), ('face', 'phase')],
            'difficulty': 'easy',
        },
        '/l/ vs /r/': {
            'pairs': [('light', 'right'), ('lead', 'read'), ('lake', 'rake'),
                      ('long', 'wrong'), ('lamp', 'ramp'), ('glass', 'grass')],
            'difficulty': 'hard',
        },
        '/ʃ/ vs /tʃ/': {
            'pairs': [('ship', 'chip'), ('shoe', 'chew'), ('shop', 'chop'),
                      ('sheep', 'cheap'), ('share', 'chair')],
            'difficulty': 'medium',
        },
        '/m/ vs /n/': {
            'pairs': [('map', 'nap'), ('sun', 'sum'), ('some', 'sun'),
                      ('ram', 'ran'), ('dim', 'din')],
            'difficulty': 'easy',
        },
        '/t/ vs /d/': {
            'pairs': [('tie', 'die'), ('town', 'down'), ('ten', 'den'),
                      ('bit', 'bid'), ('wrote', 'road')],
            'difficulty': 'medium',
        },
    },
}


class AIGameGenerator:
    """Real AI: Generates fresh games with real-time TTS."""

    # ============ 1. AI GENERATE SIMILAR-SOUNDING GAME ============
    @classmethod
    def generate_game(cls, user_id, weak_contrasts=None, difficulty='easy',
                     focus_area=None, question_count=5):
        """
        AI builds a completely NEW similar-sounding-words game.
        """
        selected_pairs = cls._ai_select_pairs(
            weak_contrasts=weak_contrasts,
            difficulty=difficulty,
            focus_area=focus_area,
            count=question_count,
        )

        questions = []
        for i, pair_data in enumerate(selected_pairs):
            word1 = pair_data['word1']
            word2 = pair_data['word2']
            contrast = pair_data['contrast']
            category = pair_data['category']

            audio1 = cls._generate_audio(word1)
            audio2 = cls._generate_audio(word2)

            # AI decides: which word to play, and hence which is correct
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
                'option_a': word1,
                'option_b': word2,
                'audio_a': audio1,
                'audio_b': audio2,
                'play_audio': play_audio,
                'correct': correct,
                'sound_contrast': contrast,
                'category': category,
            })

        return {
            'game_type': 'word_discrimination',
            'generated_by': 'AI (Dynamic TTS + Smart Analysis)',
            'difficulty': difficulty,
            'focus_area': focus_area or 'AI-selected',
            'total_questions': len(questions),
            'questions': questions,
            'ai_reasoning': cls._explain_selection(weak_contrasts, focus_area),
        }

    # ============ 2. AI PICKS BEST PAIRS ============
    @classmethod
    def _ai_select_pairs(cls, weak_contrasts, difficulty, focus_area, count):
        """AI decides which contrasts to practice."""
        all_pairs = []

        # Priority 1: Focus area
        if focus_area:
            for category in KNOWLEDGE_BASE:
                for contrast, data in KNOWLEDGE_BASE[category].items():
                    if focus_area.lower() in contrast.lower():
                        for w1, w2 in data['pairs']:
                            all_pairs.append({
                                'word1': w1, 'word2': w2,
                                'contrast': contrast, 'category': category,
                                'weight': 5,
                            })

        # Priority 2: Weak contrasts
        if weak_contrasts:
            for wc in weak_contrasts[:3]:
                for category in KNOWLEDGE_BASE:
                    for contrast, data in KNOWLEDGE_BASE[category].items():
                        if wc.lower() in contrast.lower() or contrast.lower() in wc.lower():
                            for w1, w2 in data['pairs']:
                                all_pairs.append({
                                    'word1': w1, 'word2': w2,
                                    'contrast': contrast, 'category': category,
                                    'weight': 4,
                                })

        # Priority 3: Current difficulty
        for category in KNOWLEDGE_BASE:
            for contrast, data in KNOWLEDGE_BASE[category].items():
                if data['difficulty'] == difficulty:
                    for w1, w2 in data['pairs']:
                        all_pairs.append({
                            'word1': w1, 'word2': w2,
                            'contrast': contrast, 'category': category,
                            'weight': 2,
                        })

        # Fallback: any pair
        if len(all_pairs) < count:
            for category in KNOWLEDGE_BASE:
                for contrast, data in KNOWLEDGE_BASE[category].items():
                    for w1, w2 in data['pairs']:
                        all_pairs.append({
                            'word1': w1, 'word2': w2,
                            'contrast': contrast, 'category': category,
                            'weight': 1,
                        })

        # Weighted random selection
        selected = []
        seen_pairs = set()
        attempts = 0
        while len(selected) < count and attempts < 200:
            attempts += 1
            if not all_pairs:
                break
            weights = [p['weight'] for p in all_pairs]
            choice = random.choices(all_pairs, weights=weights, k=1)[0]
            key = (choice['word1'], choice['word2'])
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            selected.append(choice)
            all_pairs = [p for p in all_pairs if (p['word1'], p['word2']) != key]

        return selected

    @classmethod
    def _explain_selection(cls, weak_contrasts, focus_area):
        if focus_area:
            return f"AI focused on '{focus_area}' as requested."
        if weak_contrasts:
            return f"AI targeted your weak areas: {', '.join(weak_contrasts[:2])}."
        return "AI selected a mix of contrasts for balanced practice."

    # ============ 3. AI GENERATE AUDIO (TTS) ============
    @classmethod
    def _generate_audio(cls, word):
        safe = word.lower().strip().replace(' ', '_')
        hash_part = hashlib.md5(word.encode()).hexdigest()[:6]
        filename = f"ai_{safe}_{hash_part}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        if os.path.exists(filepath):
            return filename

        try:
            tts = gTTS(text=word, lang='en', slow=False)
            tts.save(filepath)
            return filename
        except Exception as e:
            print(f"⚠️ TTS error for '{word}': {e}")
            return f"{safe}_01.mp3"

    # ============ 4. AI AUTO-TEST (Similar) ============
    @classmethod
    def auto_test(cls, questions, user_answers):
        results = []
        correct_count = 0

        for q in questions:
            user_ans = user_answers.get(str(q['question_id']))
            is_correct = (str(user_ans).lower() == str(q['correct']).lower())
            if is_correct:
                correct_count += 1
            results.append({
                'question_id': q['question_id'],
                'user_answer': user_ans,
                'correct_answer': q['correct'],
                'is_correct': is_correct,
                'sound_contrast': q['sound_contrast'],
            })

        accuracy = (correct_count / len(questions) * 100) if questions else 0

        by_contrast = {}
        for r in results:
            c = r['sound_contrast']
            by_contrast.setdefault(c, {'total': 0, 'correct': 0})
            by_contrast[c]['total'] += 1
            if r['is_correct']:
                by_contrast[c]['correct'] += 1

        weak_in_session = [
            {'contrast': c, 'accuracy': round(s['correct'] / s['total'] * 100, 1)}
            for c, s in by_contrast.items()
            if s['correct'] / s['total'] < 0.6
        ]

        if accuracy >= 80:
            feedback = '🌟 Excellent! AI detected strong pattern recognition.'
        elif accuracy >= 60:
            feedback = '👍 Good progress! AI suggests one more round.'
        else:
            feedback = '⚠️ AI recommends focused practice on weak contrasts.'

        return {
            'accuracy': round(accuracy, 1),
            'correct': correct_count,
            'total': len(questions),
            'results': results,
            'by_contrast': by_contrast,
            'weak_in_session': weak_in_session,
            'ai_feedback': feedback,
        }

    # ============ 5. AI GENERATE SEQUENCE GAME ============
    @classmethod
    def generate_sequence_game(cls, user_id, difficulty='easy',
                               sequence_length=3, question_count=5):
        """AI generates an auditory sequence memory game."""
        all_words = []
        for category in KNOWLEDGE_BASE:
            for contrast, data in KNOWLEDGE_BASE[category].items():
                for w1, w2 in data['pairs']:
                    all_words.append({
                        'word': w1, 'contrast': contrast,
                        'category': category, 'difficulty': data['difficulty'],
                    })
                    all_words.append({
                        'word': w2, 'contrast': contrast,
                        'category': category, 'difficulty': data['difficulty'],
                    })

        filtered = [w for w in all_words if w['difficulty'] == difficulty]
        if len(filtered) < sequence_length * 2:
            filtered = all_words

        questions = []
        for i in range(question_count):
            sequence = random.sample(filtered, sequence_length)

            seq_words = []
            seq_audios = []
            for s in sequence:
                audio = cls._generate_audio(s['word'])
                seq_words.append(s['word'])
                seq_audios.append(audio)

            correct_order = seq_words[:]

            wrong_options = []
            attempts = 0
            while len(wrong_options) < 3 and attempts < 50:
                attempts += 1
                perm = seq_words[:]
                random.shuffle(perm)
                if perm != correct_order and perm not in wrong_options:
                    wrong_options.append(perm)

            options = [correct_order] + wrong_options
            random.shuffle(options)
            correct_index = options.index(correct_order)

            questions.append({
                'question_id': i + 1,
                'ai_generated': True,
                'type': 'sequence',
                'sequence': seq_words,
                'audios': seq_audios,
                'options': [o[:] for o in options],
                'correct': correct_index,
                'difficulty': difficulty,
            })

        return {
            'game_type': 'sequence_memory',
            'generated_by': 'AI (Dynamic Sequence)',
            'difficulty': difficulty,
            'total_questions': len(questions),
            'questions': questions,
        }

    # ============ 6. AI AUTO-TEST (Sequence) ============
    @classmethod
    def auto_test_sequence(cls, questions, user_answers):
        results = []
        correct_count = 0

        for q in questions:
            user_idx = user_answers.get(str(q['question_id']))
            # user_answers may come as string — normalize
            if user_idx is not None:
                try:
                    user_idx = int(user_idx)
                except (ValueError, TypeError):
                    user_idx = None

            is_correct = (user_idx == q['correct'])
            if is_correct:
                correct_count += 1

            results.append({
                'question_id': q['question_id'],
                'user_answer': user_idx,
                'correct_answer': q['correct'],
                'is_correct': is_correct,
                'sequence': q['sequence'],
            })

        accuracy = (correct_count / len(questions) * 100) if questions else 0

        if accuracy >= 80:
            feedback = '🌟 Excellent sequence memory!'
        elif accuracy >= 60:
            feedback = '👍 Good progress. AI suggests more practice.'
        else:
            feedback = '⚠️ AI recommends slower sequences for practice.'

        return {
            'accuracy': round(accuracy, 1),
            'correct': correct_count,
            'total': len(questions),
            'results': results,
            'ai_feedback': feedback,
        }