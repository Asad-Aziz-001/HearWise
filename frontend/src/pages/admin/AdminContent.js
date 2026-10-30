import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Search, Trash2, Edit3, X, Save, RefreshCw,
  Headphones, MapPin, BookOpen, Smile, Sparkles, Repeat,
  Link as LinkIcon, AlertCircle, CheckCircle, Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import AdminLayout from './AdminLayout';

// Content type configurations
const CONTENT_TYPES = [
  {
    id: 'word_pairs',
    label: 'Word Pairs',
    icon: Headphones,
    color: '#1e6ef5',
    games: ['Similar Sounds', 'Word in Noise'],
    description: 'Pairs of similar-sounding words',
    fields: [
      { key: 'word1', label: 'Word 1', type: 'text', placeholder: 'ship', required: true },
      { key: 'word2', label: 'Word 2', type: 'text', placeholder: 'sheep', required: true },
      { key: 'sound_contrast', label: 'Sound Contrast', type: 'text', placeholder: '/ɪ/ vs /iː/' },
      { key: 'category', label: 'Category', type: 'select', options: ['vowel', 'consonant'], default: 'consonant' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'easy' },
    ],
  },
  {
    id: 'sentences',
    label: 'Sentences',
    icon: MapPin,
    color: '#0ea5e9',
    games: ['Word Position', 'Audio Story'],
    description: 'Sentences for comprehension games',
    fields: [
      { key: 'text', label: 'Sentence', type: 'textarea', placeholder: 'The cat sat on the mat', required: true },
      { key: 'category', label: 'Category', type: 'select', options: ['simple', 'story', 'complex'], default: 'simple' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'easy' },
    ],
  },
  {
    id: 'emotions',
    label: 'Emotions',
    icon: Smile,
    color: '#eab308',
    games: ['Emotion Detection'],
    description: 'Emotional sentences',
    fields: [
      { key: 'text', label: 'Sentence', type: 'textarea', placeholder: 'I am so happy today!', required: true },
      { key: 'emotion', label: 'Emotion', type: 'select', options: ['happy', 'sad', 'angry', 'neutral'], required: true },
    ],
  },
  {
    id: 'phonemes',
    label: 'Phonemes',
    icon: Sparkles,
    color: '#ec4899',
    games: ['Phoneme Replacement'],
    description: 'Phoneme transformation pairs',
    fields: [
      { key: 'original_word', label: 'Original Word', type: 'text', placeholder: 'cat', required: true },
      { key: 'new_word', label: 'New Word', type: 'text', placeholder: 'bat', required: true },
      { key: 'sound_change', label: 'Sound Change', type: 'text', placeholder: '/k/ → /b/' },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'easy' },
    ],
  },
  {
    id: 'rhyme_pairs',
    label: 'Rhyme Pairs',
    icon: Repeat,
    color: '#f59e0b',
    games: ['Rhyme Match'],
    description: 'Words that rhyme',
    fields: [
      { key: 'word1', label: 'Word 1', type: 'text', placeholder: 'cat', required: true },
      { key: 'word2', label: 'Word 2', type: 'text', placeholder: 'hat', required: true },
    ],
  },
  {
    id: 'word_chains',
    label: 'Word Chains',
    icon: LinkIcon,
    color: '#8b5cf6',
    games: ['Word Chain Memory'],
    description: 'Sequences of words (comma-separated)',
    fields: [
      { key: 'words', label: 'Words (comma-separated)', type: 'textarea', placeholder: 'ship, fan, cat', required: true },
      { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['easy', 'medium', 'hard'], default: 'easy' },
    ],
  },
];

export default function AdminContent() {
  const [activeType, setActiveType] = useState('word_pairs');
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  const currentType = CONTENT_TYPES.find(t => t.id === activeType);

  useEffect(() => {
    loadItems();
    loadStats();
  }, [activeType]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/content/${activeType}`);
      setItems(data.items || []);
    } catch (err) {
      toast.error('Could not load content');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await api.get('/admin/content-all-stats');
      setStats(data);
    } catch (err) {
      console.error(err);
    }
  };

  const reloadAll = async (spin = false) => {
    if (spin) setRefreshing(true);
    await Promise.all([loadItems(), loadStats()]);
    setRefreshing(false);
  };

  // Filter
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(item => {
      return Object.values(item).some(val =>
        val && String(val).toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery]);

  const openAddModal = () => {
    const initialData = {};
    currentType.fields.forEach(f => {
      initialData[f.key] = f.default || '';
    });
    setFormData(initialData);
    setEditingItem(null);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setFormData({ ...item });
    setEditingItem(item);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      if (editingItem) {
        await api.put(`/admin/content/${activeType}/${editingItem.id}`, formData);
        toast.success('✅ Updated successfully');
      } else {
        await api.post(`/admin/content/${activeType}`, formData);
        toast.success('✅ Added successfully');
      }
      setShowModal(false);
      reloadAll();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not save');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`/admin/content/${activeType}/${id}`);
      toast.success('Deleted');
      reloadAll();
    } catch (err) {
      toast.error('Could not delete');
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/admin/content/${activeType}/${item.id}`, {
        is_active: !item.is_active,
      });
      toast.success(item.is_active ? 'Deactivated' : 'Activated');
      reloadAll();
    } catch (err) {
      toast.error('Could not update');
    }
  };

  const renderItemDisplay = (item) => {
    switch (activeType) {
      case 'word_pairs':
        return (
          <div>
            <strong style={{ color: '#102a56' }}>{item.word1}</strong> / <strong style={{ color: '#102a56' }}>{item.word2}</strong>
            <div style={{ fontSize: 11, color: '#5a6b8c', fontFamily: 'monospace', marginTop: 2 }}>
              {item.sound_contrast || '—'}
            </div>
          </div>
        );
      case 'sentences':
        return <span style={{ color: '#102a56' }}>"{item.text}"</span>;
      case 'emotions':
        return (
          <div>
            <span style={{ color: '#102a56' }}>"{item.text}"</span>
            <div style={{ fontSize: 11, color: '#5a6b8c', marginTop: 2 }}>
              Emotion: <strong>{item.emotion}</strong>
            </div>
          </div>
        );
      case 'phonemes':
        return (
          <div>
            <strong style={{ color: '#102a56' }}>{item.original_word}</strong> → <strong style={{ color: '#ec4899' }}>{item.new_word}</strong>
            <div style={{ fontSize: 11, color: '#5a6b8c', fontFamily: 'monospace', marginTop: 2 }}>
              {item.sound_change || '—'}
            </div>
          </div>
        );
      case 'rhyme_pairs':
        return (
          <div>
            <strong style={{ color: '#102a56' }}>{item.word1}</strong> / <strong style={{ color: '#102a56' }}>{item.word2}</strong>
          </div>
        );
      case 'word_chains':
        return <span style={{ color: '#102a56', fontFamily: 'monospace' }}>{item.words}</span>;
      default:
        return JSON.stringify(item);
    }
  };

  return (
    <AdminLayout>
      {/* Topbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope', fontSize: '1.75rem', fontWeight: 800, color: '#102a56', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={32} color="#a855f7" /> Content Control Room
          </h1>
          <p style={{ fontSize: 14, color: '#5a6b8c', margin: '4px 0 0' }}>
            Manage content for all 11 games — changes reflect instantly in user games
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => reloadAll(true)} disabled={refreshing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, background: 'white', border: '1px solid #e8f0fe', color: '#5a6b8c', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
          <button onClick={openAddModal}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, background: 'linear-gradient(135deg, #a855f7, #7c3aed)', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(168, 85, 247, 0.35)' }}>
            <Plus size={16} /> Add {currentType.label}
          </button>
        </div>
      </div>

      {/* Content Type Tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12, marginBottom: 24 }}>
        {CONTENT_TYPES.map(type => {
          const typeStats = stats?.[type.id];
          const isActive = activeType === type.id;
          return (
            <button key={type.id} onClick={() => setActiveType(type.id)}
              style={{
                padding: 16, borderRadius: 12,
                background: isActive ? 'white' : '#f8faff',
                border: isActive ? `2px solid ${type.color}` : '1px solid #e8f0fe',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: isActive ? `0 4px 14px ${type.color}25` : 'none',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${type.color}15`, color: type.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <type.icon size={16} />
                </div>
                {typeStats && (
                  <span style={{ fontSize: 16, fontWeight: 800, color: type.color }}>
                    {typeStats.total}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#102a56' }}>{type.label}</div>
              <div style={{ fontSize: 10, color: '#8a9ab5', marginTop: 2 }}>
                {typeStats?.active || 0} active
              </div>
            </button>
          );
        })}
      </div>

      {/* Info banner */}
      <div style={{ padding: 16, background: `linear-gradient(135deg, ${currentType.color}15, ${currentType.color}08)`, borderRadius: 12, marginBottom: 24, border: `1px solid ${currentType.color}30`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: currentType.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <currentType.icon size={20} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#102a56' }}>
            {currentType.label} — Used in: {currentType.games.join(', ')}
          </div>
          <div style={{ fontSize: 12, color: '#5a6b8c' }}>
            {currentType.description}. Changes reflect immediately when users play.
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ background: 'white', padding: 16, borderRadius: 16, border: '1px solid #e8f0fe', marginBottom: 16 }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8a9ab5' }} />
          <input type="text" placeholder={`Search ${currentType.label.toLowerCase()}...`} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 10, border: '1px solid #e8f0fe', fontSize: 14, outline: 'none' }} />
        </div>
      </div>

      {/* Items List */}
      <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e8f0fe' }}>
        <div style={{ marginBottom: 12, fontSize: 13, color: '#5a6b8c' }}>
          Showing <strong style={{ color: '#102a56' }}>{filteredItems.length}</strong> of <strong style={{ color: '#102a56' }}>{items.length}</strong> items
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e8f0fe', borderTopColor: currentType.color, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#5a6b8c' }}>Loading...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>📝</div>
            <p style={{ color: '#8a9ab5', fontSize: 15, marginBottom: 20 }}>
              {items.length === 0 ? `No ${currentType.label.toLowerCase()} yet. AI uses default content.` : 'No items match your search'}
            </p>
            {items.length === 0 && (
              <button onClick={openAddModal}
                style={{ padding: '10px 20px', background: currentType.color, color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Add First {currentType.label.slice(0, -1)}
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filteredItems.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, background: item.is_active === false ? '#f9fafb' : '#f8faff', borderRadius: 12, border: '1px solid #e8f0fe', opacity: item.is_active === false ? 0.6 : 1 }}>
                
                <div style={{ flex: 1 }}>
                  {renderItemDisplay(item)}
                </div>

                {item.difficulty && (
                  <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                    background: item.difficulty === 'easy' ? '#d1fae5' : item.difficulty === 'medium' ? '#fef3c7' : '#fee2e2',
                    color: item.difficulty === 'easy' ? '#059669' : item.difficulty === 'medium' ? '#b45309' : '#dc2626' }}>
                    {item.difficulty}
                  </span>
                )}

                <button onClick={() => toggleActive(item)} title={item.is_active ? 'Deactivate' : 'Activate'}
                  style={{ padding: 8, background: item.is_active ? '#d1fae5' : '#fee2e2', color: item.is_active ? '#059669' : '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  <Power size={14} />
                </button>
                <button onClick={() => openEditModal(item)} title="Edit"
                  style={{ padding: 8, background: '#e8f0fe', color: '#1e6ef5', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  <Edit3 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} title="Delete"
                  style={{ padding: 8, background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !formLoading && setShowModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 600, width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontFamily: 'Manrope', fontSize: '1.4rem', fontWeight: 800, color: '#102a56', margin: 0 }}>
                  {editingItem ? '✏️ Edit' : '➕ Add'} {currentType.label.slice(0, -1)}
                </h2>
                <button onClick={() => setShowModal(false)} disabled={formLoading}
                  style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                {currentType.fields.map(field => (
                  <div key={field.key} style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#102a56', marginBottom: 6, display: 'block' }}>
                      {field.label} {field.required && '*'}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={field.placeholder} required={field.required} rows={3}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8f0fe', fontSize: 14, fontFamily: 'inherit', resize: 'vertical' }} />
                    ) : field.type === 'select' ? (
                      <select value={formData[field.key] || field.default} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8f0fe', fontSize: 14 }}>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={formData[field.key] || ''} onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                        placeholder={field.placeholder} required={field.required}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #e8f0fe', fontSize: 14, fontFamily: field.key === 'words' || field.key === 'sound_contrast' ? 'monospace' : 'inherit' }} />
                    )}
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="button" onClick={() => setShowModal(false)} disabled={formLoading}
                    style={{ padding: '10px 20px', background: 'white', border: '1px solid #e8f0fe', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#5a6b8c', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={formLoading}
                    style={{ padding: '10px 24px', background: currentType.color, color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: formLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={14} />
                    {formLoading ? 'Saving...' : editingItem ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AdminLayout>
  );
}