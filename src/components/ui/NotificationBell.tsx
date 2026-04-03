import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/auth/notifications');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      try {
        await api.put('/auth/notifications/read');
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={handleOpen}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', position: 'relative', color: '#94a3b8', display: 'flex', alignItems: 'center' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 5px', fontSize: '10px', fontWeight: 'bold' }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', right: 0, top: '40px', width: '300px', background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', zIndex: 1000, boxShadow: '0 10px 25px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', background: '#0f172a', borderBottom: '1px solid #334155', fontWeight: 'bold' }}>Notificaciones</div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No hay notificaciones</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #334155', background: n.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.1)' }}>
                  <p style={{ margin: 0, fontSize: '13px', color: n.isRead ? '#94a3b8' : '#e2e8f0' }}>{n.message}</p>
                  <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block' }}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
