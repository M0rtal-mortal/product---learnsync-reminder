import { useState, useEffect } from 'react';
import { Bell, BellOff, Check, CheckCheck, Trash2, Clock, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Notification, NotificationSettings } from '@/types';
import { notificationsApi } from '@/lib/api';

const TYPE_ICONS: Record<string, { icon: React.ReactNode; cls: string }> = {
  exam_reminder: { icon: <Clock className="w-4 h-4" />, cls: 'bg-amber-50 text-amber-600' },
  conflict: { icon: <AlertTriangle className="w-4 h-4" />, cls: 'bg-red-50 text-red-600' },
  sync_success: { icon: <Check className="w-4 h-4" />, cls: 'bg-green-50 text-green-600' },
  meeting_invite: { icon: <Bell className="w-4 h-4" />, cls: 'bg-[oklch(0.28_0.07_240)]/10 text-[oklch(0.28_0.07_240)]' },
  general: { icon: <Info className="w-4 h-4" />, cls: 'bg-[oklch(0.955_0.008_240)] text-[oklch(0.48_0.05_240)]' },
};

interface Props {
  notifications: Notification[];
  onNotificationsChange: () => void;
}

export default function NotificationView({ notifications, onNotificationsChange }: Props) {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const res = await notificationsApi.getSettings();
        if (res.success) setSettings(res.data);
      } catch {
        // ignore
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await notificationsApi.markRead(id);
      if (res.success) onNotificationsChange();
    } catch { toast.error('操作失败'); }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationsApi.markAllRead();
      if (res.success) { toast.success('已全部标记为已读'); onNotificationsChange(); }
    } catch { toast.error('操作失败'); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await notificationsApi.delete(id);
      if (res.success) onNotificationsChange();
      else toast.error('删除失败');
    } catch { toast.error('网络错误'); }
    finally { setDeletingId(null); }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const res = await notificationsApi.updateSettings(settings);
      if (res.success) { toast.success('设置已保存'); setSettings(res.data); }
      else toast.error('保存失败');
    } catch { toast.error('网络错误'); }
    finally { setSavingSettings(false); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[oklch(0.12_0.025_240)] font-serif">通知中心</h2>
          <p className="text-sm text-[oklch(0.48_0.05_240)] mt-0.5">管理提醒通知和免打扰设置</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead}
            className="flex items-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all min-h-[40px] self-start sm:self-auto">
            <CheckCheck className="w-4 h-4" />
            全部标记已读
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.87_0.02_240)]">
          <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif">所有通知</h3>
          {unreadCount > 0 && (
            <span className="text-xs bg-[oklch(0.28_0.07_240)] text-white px-2.5 py-0.5 rounded-full font-medium">{unreadCount}条新</span>
          )}
        </div>
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-12 h-12 text-[oklch(0.87_0.02_240)] mx-auto mb-3" />
            <p className="text-sm text-[oklch(0.48_0.05_240)]">暂无通知</p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.87_0.02_240)]">
            {notifications.map(n => {
              const typeInfo = TYPE_ICONS[n.type] || TYPE_ICONS.general;
              return (
                <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-[oklch(0.955_0.008_240)] transition-colors ${
                  !n.isRead ? 'bg-[oklch(0.28_0.07_240)]/3' : ''
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeInfo.cls}`}>
                    {typeInfo.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-medium text-[oklch(0.12_0.025_240)] ${!n.isRead ? 'font-semibold' : ''}`}>{n.title}</p>
                      {!n.isRead && <div className="w-2 h-2 bg-[oklch(0.28_0.07_240)] rounded-full flex-shrink-0 mt-1.5" />}
                    </div>
                    <p className="text-xs text-[oklch(0.48_0.05_240)] mt-0.5 leading-relaxed">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-[oklch(0.48_0.05_240)]">{new Date(n.createdAt).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      {!n.isRead && (
                        <button onClick={() => handleMarkRead(n.id)}
                          className="text-xs font-medium text-[oklch(0.28_0.07_240)] hover:underline">
                          标记已读
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(n.id)} disabled={deletingId === n.id}
                    className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-[oklch(0.87_0.02_240)] hover:text-red-500 flex-shrink-0 disabled:opacity-50">
                    {deletingId === n.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-6">
        <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif mb-5">通知设置</h3>
        {loadingSettings ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[oklch(0.48_0.05_240)]" />
          </div>
        ) : settings ? (
          <div className="space-y-5">
            {/* Channel Settings */}
            <div>
              <h4 className="text-sm font-semibold text-[oklch(0.12_0.025_240)] mb-3">通知渠道</h4>
              <div className="space-y-3">
                {[
                  { key: 'inAppEnabled' as const, label: '应用内通知', desc: '在应用内显示提醒弹窗' },
                  { key: 'emailEnabled' as const, label: '邮件通知', desc: '发送提醒邮件到注册邮箱' },
                  { key: 'pushEnabled' as const, label: '推送通知', desc: '浏览器推送通知' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-[oklch(0.955_0.008_240)] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[oklch(0.12_0.025_240)]">{label}</p>
                      <p className="text-xs text-[oklch(0.48_0.05_240)]">{desc}</p>
                    </div>
                    <button
                      onClick={() => setSettings(s => s ? { ...s, [key]: !s[key] } : s)}
                      className={`relative w-10 h-5 rounded-full transition-all ${
                        settings[key] ? 'bg-[oklch(0.28_0.07_240)]' : 'bg-[oklch(0.87_0.02_240)]'
                      }`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                        settings[key] ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quiet Hours */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-[oklch(0.12_0.025_240)]">免打扰时段</h4>
                  <p className="text-xs text-[oklch(0.48_0.05_240)] mt-0.5">免打扰时段内所有推送通知将被静音</p>
                </div>
                <button
                  onClick={() => setSettings(s => s ? { ...s, quietHoursEnabled: !s.quietHoursEnabled } : s)}
                  className={`relative w-10 h-5 rounded-full transition-all ${
                    settings.quietHoursEnabled ? 'bg-[oklch(0.28_0.07_240)]' : 'bg-[oklch(0.87_0.02_240)]'
                  }`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    settings.quietHoursEnabled ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              {settings.quietHoursEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[oklch(0.48_0.05_240)] mb-1">开始时间</label>
                    <input type="time" value={settings.quietStart}
                      onChange={e => setSettings(s => s ? { ...s, quietStart: e.target.value } : s)}
                      className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs text-[oklch(0.48_0.05_240)] mb-1">结束时间</label>
                    <input type="time" value={settings.quietEnd}
                      onChange={e => setSettings(s => s ? { ...s, quietEnd: e.target.value } : s)}
                      className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
                  </div>
                </div>
              )}
            </div>

            {/* Exam Reminder Days */}
            <div>
              <label className="block text-sm font-semibold text-[oklch(0.12_0.025_240)] mb-2">考试提前提醒天数</label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={30} value={settings.examReminderDays}
                  onChange={e => setSettings(s => s ? { ...s, examReminderDays: Number(e.target.value) } : s)}
                  className="flex-1 accent-[oklch(0.28_0.07_240)]" />
                <span className="text-sm font-semibold text-[oklch(0.28_0.07_240)] w-16 text-right">{settings.examReminderDays} 天前</span>
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={savingSettings}
              className="w-full flex items-center justify-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-60">
              {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {savingSettings ? '保存中...' : '保存设置'}
            </button>
          </div>
        ) : (
          <p className="text-sm text-[oklch(0.48_0.05_240)] text-center py-4">设置加载失败</p>
        )}
      </div>
    </div>
  );
}
