'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Message = {
  id: string; name: string; email: string;
  subject: string | null; message: string;
  read: boolean; created_at: string; email_sent: boolean
  project_type: string | null; budget_range: string | null;
  timeline: string | null; preferred_contact: string | null
}

export function MessagesManager({ initialMessages }: { initialMessages: Message[] }) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [query, setQuery] = useState('')
  const [clearing, setClearing] = useState(false)

  const filtered = useMemo(() => {
    return messages.filter(m => {
      if (filter === 'unread' && m.read) return false
      if (filter === 'read' && !m.read) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        return m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          (m.subject || '').toLowerCase().includes(q) ||
          m.message.toLowerCase().includes(q) ||
          (m.project_type || '').toLowerCase().includes(q) ||
          (m.budget_range || '').toLowerCase().includes(q)
      }
      return true
    })
  }, [messages, filter, query])

  const unreadCount = messages.filter(m => !m.read).length
  const readCount = messages.filter(m => m.read).length

  const toggleRead = async (id: string, current: boolean) => {
    const supabase = createClient()
    const { error } = await supabase.from('messages').update({ read: !current }).eq('id', id)
    if (error) { alert(`Couldn't update: ${error.message}`); return }
    setMessages(ms => ms.map(m => m.id === id ? { ...m, read: !current } : m))
    router.refresh()
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message? This cannot be undone.')) return
    const supabase = createClient()
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (error) { alert(`Couldn't delete: ${error.message}`); return }
    setMessages(ms => ms.filter(m => m.id !== id))
    router.refresh()
  }

  const clearAllRead = async () => {
    if (readCount === 0) return
    if (!confirm(`Delete all ${readCount} read message${readCount !== 1 ? 's' : ''}? This cannot be undone.`)) return
    setClearing(true)
    const supabase = createClient()
    const { error } = await supabase.from('messages').delete().eq('read', true)
    setClearing(false)
    if (error) { alert(`Couldn't clear: ${error.message}`); return }
    setMessages(ms => ms.filter(m => !m.read))
    router.refresh()
  }

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="msg-filter-pills">
          {[
            { key: 'all', label: 'All', count: messages.length },
            { key: 'unread', label: 'Unread', count: unreadCount },
            { key: 'read', label: 'Read', count: readCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as 'all' | 'unread' | 'read')}
              className={`msg-pill ${filter === f.key ? 'msg-pill-active' : ''}`}
            >
              {f.label} <span className="msg-pill-count">{f.count}</span>
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search name, email, or message..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="msg-search"
        />

        {readCount > 0 && (
          <button onClick={clearAllRead} disabled={clearing} className="msg-clear-btn">
            {clearing ? 'Clearing...' : `Clear ${readCount} read →`}
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontStyle: 'italic', color: '#444' }}>
            {messages.length === 0 ? 'No messages yet.' : 'No messages match your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {filtered.map(m => (
            <div key={m.id} style={{
              background: m.read ? '#0A0A0A' : '#0F0A0A',
              border: `1px solid ${m.read ? '#1F1F1F' : '#2A1A1A'}`,
              padding: '24px',
              marginBottom: 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {!m.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#C41E3A', flexShrink: 0 }} />}
                  <div>
                    <span style={{ fontSize: 15, fontWeight: m.read ? 400 : 600, color: '#FAFAF9' }}>{m.name}</span>
                    <a href={`mailto:${m.email}?subject=Re: ${m.subject || 'Your message to Nicopixel'}`} style={{ fontSize: 12, color: '#555', marginLeft: 10, textDecoration: 'none' }}>{m.email}</a>
                  </div>
                  {m.email_sent === false && (
                    <span title="The email notification for this message failed to send - check your Resend setup" style={{
                      fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: '#E0A030', border: '1px solid #5A4520', background: 'rgba(224,160,48,0.08)',
                      padding: '3px 8px', flexShrink: 0,
                    }}>⚠ Email not sent</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: '#444' }}>
                    {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button onClick={() => toggleRead(m.id, m.read)} className="msg-action-btn">
                    {m.read ? 'Mark Unread' : 'Mark Read'}
                  </button>
                  <button onClick={() => deleteMessage(m.id)} className="msg-action-btn msg-action-btn-danger">
                    Delete
                  </button>
                </div>
              </div>
              {m.subject && (
                <p style={{ fontSize: 12, letterSpacing: '0.06em', color: '#666', marginBottom: 8 }}>{m.subject}</p>
              )}
              {(m.project_type || m.budget_range || m.timeline || m.preferred_contact) && (
                <dl className="message-qualification">
                  {[
                    ['Project', m.project_type],
                    ['Budget', m.budget_range],
                    ['Timeline', m.timeline],
                    ['Reply via', m.preferred_contact],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <p style={{ fontSize: 14, color: '#999', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.message}</p>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .msg-filter-pills { display: flex; gap: 6px; }
        .msg-pill {
          padding: 8px 14px; background: none; border: 1px solid #2A2A2A;
          color: #666; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase;
          font-family: inherit; cursor: pointer; transition: border-color 0.2s, color 0.2s;
          display: flex; align-items: center; gap: 6px;
        }
        .msg-pill:hover { border-color: #444; color: #999; }
        .msg-pill-active { border-color: #C41E3A; color: #FAFAF9; background: rgba(196,30,58,0.08); }
        .msg-pill-count { color: #555; }
        .msg-pill-active .msg-pill-count { color: #C41E3A; }

        .msg-search {
          flex: 1; min-width: 200px; max-width: 320px;
          padding: 9px 14px; background: #0A0A0A; border: 1px solid #1F1F1F;
          color: #FAFAF9; font-size: 13px; font-family: inherit; outline: none;
          transition: border-color 0.2s;
        }
        .msg-search:focus { border-color: #C41E3A; }
        .msg-search::placeholder { color: #444; }

        .msg-clear-btn {
          margin-left: auto;
          padding: 9px 18px; background: transparent; border: 1px solid #333;
          color: #888; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
          font-family: inherit; cursor: pointer; transition: border-color 0.2s, color 0.2s;
        }
        .msg-clear-btn:hover { border-color: #C41E3A; color: #C41E3A; }

        .msg-action-btn {
          font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #555; background: none; border: 1px solid #333;
          padding: 5px 10px; font-family: inherit; cursor: pointer;
          transition: color 0.2s, border-color 0.2s; white-space: nowrap;
        }
        .msg-action-btn:hover { color: #999; border-color: #555; }
        .msg-action-btn-danger:hover { color: #C41E3A; border-color: #C41E3A; }
        .message-qualification {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1px;
          margin: 16px 0; background: #1F1F1F; border: 1px solid #1F1F1F;
        }
        .message-qualification > div { background: #0A0A0A; padding: 12px 14px; }
        .message-qualification dt { font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: #555; margin-bottom: 5px; }
        .message-qualification dd { margin: 0; font-size: 12px; color: #D6D6D6; line-height: 1.4; }

        @media(max-width: 640px) {
          .msg-search { max-width: none; width: 100%; }
          .msg-clear-btn { margin-left: 0; }
          .message-qualification { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
