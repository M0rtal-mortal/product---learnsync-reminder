import { useState } from 'react';
import { Plus, Trash2, Users, MapPin, Calendar, Share2, Mail, Loader2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Meeting, CreateMeetingInput, MeetingCategory, RsvpStatus } from '@/types';
import { meetingsApi } from '@/lib/api';

const CATEGORY_LABELS: Record<MeetingCategory, { label: string; cls: string }> = {
  class: { label: '班级会议', cls: 'bg-[oklch(0.28_0.07_240)]/10 text-[oklch(0.28_0.07_240)]' },
  club: { label: '社团部门会议', cls: 'bg-[oklch(0.42_0.09_240)]/10 text-[oklch(0.42_0.09_240)]' },
  study: { label: '学习小组讨论', cls: 'bg-amber-50 text-amber-700' },
};

const RSVP_LABELS: Record<RsvpStatus, { label: string; cls: string }> = {
  pending: { label: '待回复', cls: 'bg-amber-50 text-amber-700' },
  confirmed: { label: '已确认', cls: 'bg-green-50 text-green-700' },
  declined: { label: '已拒绝', cls: 'bg-red-50 text-red-600' },
};

interface Props {
  meetings: Meeting[];
  onMeetingsChange: () => void;
}

export default function MeetingView({ meetings, onMeetingsChange }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateMeetingInput>({
    title: '', category: 'class', meetingDate: '', startTime: '', endTime: '', location: '', participants: '', description: '',
  });
  const [editForm, setEditForm] = useState<Partial<CreateMeetingInput>>({});

  const resetForm = () => setForm({ title: '', category: 'class', meetingDate: '', startTime: '', endTime: '', location: '', participants: '', description: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.meetingDate || !form.startTime) {
      toast.error('请填写必填项：标题、日期、时间');
      return;
    }
    try {
      const res = await meetingsApi.create(form);
      if (res.success) {
        toast.success('会议已创建', { description: '已自动向参与者发送邀请' });
        setShowCreate(false);
        resetForm();
        onMeetingsChange();
      } else {
        toast.error('创建失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await meetingsApi.delete(id);
      if (res.success) { toast.success('会议已删除'); onMeetingsChange(); }
      else toast.error('删除失败');
    } catch { toast.error('网络错误'); }
    finally { setLoadingId(null); }
  };

  const handleCancel = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await meetingsApi.update(id, { status: 'cancelled' });
      if (res.success) { toast.success('会议已取消，已通知参与者'); onMeetingsChange(); }
      else toast.error('操作失败');
    } catch { toast.error('网络错误'); }
    finally { setLoadingId(null); }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const res = await meetingsApi.update(id, editForm);
      if (res.success) { toast.success('会议已更新'); setEditingId(null); onMeetingsChange(); }
      else toast.error('更新失败');
    } catch { toast.error('网络错误'); }
  };

  const handleShareLink = (meeting: Meeting) => {
    const link = `${window.location.origin}/#/rsvp/${meeting.id}`;
    navigator.clipboard.writeText(link).then(() => toast.success('邀请链接已复制'));
  };

  const handleShareEmail = (meeting: Meeting) => {
    const subject = encodeURIComponent(`邀请：${meeting.title}`);
    const body = encodeURIComponent(`您好，

请您参加以下会议：
标题：${meeting.title}
日期：${meeting.meetingDate} ${meeting.startTime}
地点：${meeting.location || '待确定'}

请回复确认是否参加。`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const activeMeetings = meetings.filter(m => m.status === 'active');
  const cancelledMeetings = meetings.filter(m => m.status === 'cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[oklch(0.12_0.025_240)] font-serif">会议管理</h2>
          <p className="text-sm text-[oklch(0.48_0.05_240)] mt-0.5">创建和管理班级、社团、学习小组会议</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all min-h-[40px] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          新建会议
        </button>
      </div>

      {/* Create Meeting Form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between">
            <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif">新建会议</h3>
            <span className="text-xs text-[oklch(0.48_0.05_240)] bg-[oklch(0.955_0.008_240)] px-3 py-1 rounded-full">班长 / 社团负责人</span>
          </div>
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">会议标题 <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="例：2026春季学期第一次班会"
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">会议类型 <span className="text-red-500">*</span></label>
                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as MeetingCategory }))}
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all">
                  <option value="class">班级会议</option>
                  <option value="club">社团部门会议</option>
                  <option value="study">学习小组讨论</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">日期 <span className="text-red-500">*</span></label>
                <input type="date" value={form.meetingDate} onChange={e => setForm(p => ({ ...p, meetingDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">开始时间 <span className="text-red-500">*</span></label>
                <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">结束时间</label>
                <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">地点</label>
                <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="例：第二教学楼 301"
                  className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">参与人员（邮箱，逗号分隔）</label>
              <input value={form.participants} onChange={e => setForm(p => ({ ...p, participants: e.target.value }))}
                placeholder="zhang@bwu.edu.cn, li@bwu.edu.cn"
                className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[oklch(0.12_0.025_240)] mb-1.5">会议说明</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                rows={2} placeholder="会议议程、注意事项等"
                className="w-full px-4 py-2.5 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all resize-none" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[oklch(0.48_0.05_240)]">分享方式：</span>
                <button type="button" onClick={() => toast.info('微信分享功能即将上线')}
                  className="flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-all">
                  <Share2 className="w-3.5 h-3.5" />微信
                </button>
                <button type="button" onClick={() => handleShareEmail({ ...form, id: '', userId: '', status: 'active', shareLink: '', rsvps: [], createdAt: '', updatedAt: '', endTime: form.endTime || '', location: form.location || '', participants: form.participants || '', description: form.description || '' } as Meeting)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[oklch(0.42_0.09_240)] bg-[oklch(0.42_0.09_240)]/10 hover:bg-[oklch(0.42_0.09_240)]/20 px-3 py-1.5 rounded-lg transition-all">
                  <Mail className="w-3.5 h-3.5" />邮件
                </button>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowCreate(false); resetForm(); }}
                  className="px-4 py-2 text-sm text-[oklch(0.48_0.05_240)] border border-[oklch(0.87_0.02_240)] rounded-xl hover:text-[oklch(0.12_0.025_240)] transition-all">
                  取消
                </button>
                <button type="submit"
                  className="flex items-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold px-6 py-2 rounded-xl text-sm transition-all shadow-md">
                  <Check className="w-4 h-4" />创建并发送邀请
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Active Meetings */}
      {activeMeetings.length === 0 && !showCreate ? (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-[oklch(0.87_0.02_240)] mx-auto mb-3" />
          <p className="text-sm text-[oklch(0.48_0.05_240)]">暂无会议安排，点击「新建会议」开始组织</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeMeetings.map(meeting => {
            const catInfo = CATEGORY_LABELS[meeting.category as MeetingCategory] || CATEGORY_LABELS.class;
            const confirmedCount = meeting.rsvps.filter(r => r.status === 'confirmed').length;
            const pendingCount = meeting.rsvps.filter(r => r.status === 'pending').length;
            const isExpanded = expandedId === meeting.id;
            const isEditing = editingId === meeting.id;

            return (
              <div key={meeting.id} className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                <div className="p-5">
                  {isEditing ? (
                    <div className="space-y-3">
                      <input value={editForm.title ?? meeting.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                        className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={editForm.meetingDate ?? meeting.meetingDate} onChange={e => setEditForm(p => ({ ...p, meetingDate: e.target.value }))}
                          className="px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30" />
                        <input type="time" value={editForm.startTime ?? meeting.startTime} onChange={e => setEditForm(p => ({ ...p, startTime: e.target.value }))}
                          className="px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30" />
                      </div>
                      <input value={editForm.location ?? meeting.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                        placeholder="地点" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs border border-[oklch(0.87_0.02_240)] rounded-lg text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)] transition-all">取消</button>
                        <button onClick={() => handleSaveEdit(meeting.id)} className="px-3 py-1.5 text-xs bg-[oklch(0.28_0.07_240)] text-white rounded-lg hover:bg-[oklch(0.32_0.07_240)] transition-all">保存</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[oklch(0.28_0.07_240)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-[oklch(0.28_0.07_240)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[oklch(0.12_0.025_240)]">{meeting.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catInfo.cls}`}>{catInfo.label}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[oklch(0.48_0.05_240)]">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{meeting.meetingDate} {meeting.startTime}{meeting.endTime ? `–${meeting.endTime}` : ''}</span>
                          {meeting.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{meeting.location}</span>}
                          {meeting.rsvps.length > 0 && (
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{confirmedCount}人已确认 · {pendingCount}人待回复</span>
                          )}
                        </div>
                        {meeting.description && <p className="text-xs text-[oklch(0.48_0.05_240)] mt-1 line-clamp-2">{meeting.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => handleShareLink(meeting)} title="复制邀请链接"
                          className="p-1.5 hover:bg-[oklch(0.955_0.008_240)] rounded-lg transition-all text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.28_0.07_240)]">
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingId(meeting.id); setEditForm({}); }} title="编辑"
                          className="p-1.5 hover:bg-[oklch(0.955_0.008_240)] rounded-lg transition-all text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.28_0.07_240)]">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleCancel(meeting.id)} disabled={loadingId === meeting.id} title="取消会议"
                          className="p-1.5 hover:bg-amber-50 rounded-lg transition-all text-amber-600 disabled:opacity-50">
                          <X className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(meeting.id)} disabled={loadingId === meeting.id} title="删除"
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-red-500 disabled:opacity-50">
                          {loadingId === meeting.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* RSVP Section */}
                {meeting.rsvps.length > 0 && (
                  <div className="border-t border-[oklch(0.87_0.02_240)]">
                    <button onClick={() => setExpandedId(isExpanded ? null : meeting.id)}
                      className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-[oklch(0.48_0.05_240)] hover:bg-[oklch(0.955_0.008_240)] transition-colors">
                      <span>参与者 RSVP 状态 ({meeting.rsvps.length}人)</span>
                      <span>{isExpanded ? '收起' : '展开'}</span>
                    </button>
                    {isExpanded && (
                      <div className="px-5 pb-4 grid sm:grid-cols-2 gap-2">
                        {meeting.rsvps.map(rsvp => {
                          const rsvpInfo = RSVP_LABELS[rsvp.status as RsvpStatus] || RSVP_LABELS.pending;
                          return (
                            <div key={rsvp.id} className="flex items-center justify-between p-2 bg-[oklch(0.955_0.008_240)] rounded-lg">
                              <span className="text-xs text-[oklch(0.12_0.025_240)] truncate">{rsvp.participantEmail}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ml-2 ${rsvpInfo.cls}`}>{rsvpInfo.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Cancelled Meetings */}
      {cancelledMeetings.length > 0 && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[oklch(0.87_0.02_240)]">
            <h3 className="font-bold text-[oklch(0.48_0.05_240)] font-serif text-sm">已取消的会议 ({cancelledMeetings.length})</h3>
          </div>
          <div className="divide-y divide-[oklch(0.87_0.02_240)]">
            {cancelledMeetings.map(m => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[oklch(0.12_0.025_240)] line-through truncate">{m.title}</p>
                  <p className="text-xs text-[oklch(0.48_0.05_240)]">{m.meetingDate} {m.startTime}</p>
                </div>
                <button onClick={() => handleDelete(m.id)} disabled={loadingId === m.id}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-red-400 disabled:opacity-50">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
