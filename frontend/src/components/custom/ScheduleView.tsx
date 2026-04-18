import { useState, useMemo } from 'react';
import { Plus, RefreshCw, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Download, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Course, Meeting, Exam, ConflictPair, ScheduleEvent } from '@/types';
import { coursesApi } from '@/lib/api';

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const COLOR_MAP: Record<string, string> = {
  primary: 'bg-[oklch(0.28_0.07_240)]/10 text-[oklch(0.28_0.07_240)]',
  secondary: 'bg-[oklch(0.42_0.09_240)]/10 text-[oklch(0.42_0.09_240)]',
  success: 'bg-green-50 text-green-700',
  accent: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
};

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const detectConflicts = (events: ScheduleEvent[]): ConflictPair[] => {
  const conflicts: ConflictPair[] = [];
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i], b = events[j];
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      const aStart = timeToMinutes(a.startTime), aEnd = timeToMinutes(a.endTime);
      const bStart = timeToMinutes(b.startTime), bEnd = timeToMinutes(b.endTime);
      if (aStart < bEnd && aEnd > bStart) {
        conflicts.push({ event1: a, event2: b, dayOfWeek: a.dayOfWeek });
      }
    }
  }
  return conflicts;
};

interface Props {
  courses: Course[];
  meetings: Meeting[];
  exams: Exam[];
  onCoursesChange: () => void;
}

type CalendarView = 'day' | 'week' | 'month';

export default function ScheduleView({ courses, meetings, exams, onCoursesChange }: Props) {
  const [view, setView] = useState<CalendarView>('week');
  const [importing, setImporting] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [newCourse, setNewCourse] = useState({
    name: '', teacher: '', location: '', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary',
  });
  const [editCourse, setEditCourse] = useState({
    name: '', teacher: '', location: '', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary',
  });

  // Build schedule events for conflict detection
  const scheduleEvents: ScheduleEvent[] = useMemo(() => [
    ...courses.map(c => ({
      id: c.id, title: c.name, type: 'course' as const,
      dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime,
      location: c.location, color: c.color,
    })),
    ...meetings.filter(m => m.status === 'active').map(m => {
      const date = new Date(m.meetingDate);
      const dow = (date.getDay() + 6) % 7; // convert Sun=0 to Mon=0
      return {
        id: m.id, title: m.title, type: 'meeting' as const,
        dayOfWeek: dow, startTime: m.startTime, endTime: m.endTime || m.startTime,
        location: m.location, color: 'success',
      };
    }),
  ], [courses, meetings]);

  const conflicts = useMemo(() => detectConflicts(scheduleEvents), [scheduleEvents]);
  const conflictIds = useMemo(() => new Set(conflicts.flatMap(c => [c.event1.id, c.event2.id])), [conflicts]);

  const [showSchoolLogin, setShowSchoolLogin] = useState(false);
  const [school, setSchool] = useState('');
  const [schoolUsername, setSchoolUsername] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showSupportedSchools, setShowSupportedSchools] = useState(false);

  // 已支持的高校列表
  const supportedSchools = [
    '北京大学',
    '清华大学',
    '南京审计大学',
    '北京工商大学',
    '南京大学',
    '复旦大学',
    '上海交通大学',
    '浙江大学',
    '中国人民大学',
    '上海财经大学',
    '中央财经大学',
    '对外经济贸易大学',
    '南开大学',
    '武汉大学',
    '华中科技大学',
    '中山大学',
    '华南理工大学',
    '西安交通大学',
    '哈尔滨工业大学',
    '同济大学'
  ];

  const handleImport = () => {
    setShowSchoolLogin(true);
  };

  const handleSchoolLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !schoolUsername || !schoolPassword) {
      toast.error('请填写所有字段');
      return;
    }
    setLoginLoading(true);
    try {
      const res = await coursesApi.import({ school, username: schoolUsername, password: schoolPassword });
      if (res.success) {
        toast.success('课表导入成功', { description: res.message || `已从${school}信息门户导入 ${Array.isArray(res.data) ? res.data.length : 0} 门课程` });
        setShowSchoolLogin(false);
        setSchool('');
        setSchoolUsername('');
        setSchoolPassword('');
        onCoursesChange();
      } else {
        toast.error('导入失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误，请稍后重试');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await coursesApi.delete(id);
      if (res.success) {
        toast.success('课程已删除');
        onCoursesChange();
      } else {
        toast.error('删除失败');
      }
    } catch {
      toast.error('网络错误');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.name) { toast.error('请填写课程名称'); return; }
    try {
      const res = await coursesApi.create(newCourse);
      if (res.success) {
        toast.success('课程已添加');
        setShowAddCourse(false);
        setNewCourse({ name: '', teacher: '', location: '', dayOfWeek: 0, startTime: '08:00', endTime: '09:40', color: 'primary' });
        onCoursesChange();
      } else {
        toast.error('添加失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setEditCourse({
      name: course.name,
      teacher: course.teacher,
      location: course.location,
      dayOfWeek: course.dayOfWeek,
      startTime: course.startTime,
      endTime: course.endTime,
      color: course.color,
    });
    setShowEditCourse(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    try {
      const res = await coursesApi.update(editingCourse.id, editCourse);
      if (res.success) {
        toast.success('课程已更新');
        setShowEditCourse(false);
        setEditingCourse(null);
        onCoursesChange();
      } else {
        toast.error('更新失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    }
  };

  // Get today's date info
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7;

  // Get week start date
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - todayDow + currentWeekOffset * 7);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.getFullYear()}年${start.getMonth() + 1}月${start.getDate()}日 — ${end.getMonth() + 1}月${end.getDate()}日`;
  };

  const getEventsForDay = (dow: number) => scheduleEvents.filter(e => e.dayOfWeek === dow);

  const todayCourses = courses.filter(c => c.dayOfWeek === todayDow);
  const todayMeetings = meetings.filter(m => {
    const d = new Date(m.meetingDate);
    return d.toDateString() === today.toDateString() && m.status === 'active';
  });

  return (
    <div className="space-y-6">
      {/* Conflict Alert */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">检测到 {conflicts.length} 个日程冲突</p>
            <div className="mt-1 space-y-1">
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-amber-700">
                  {DAY_LABELS[c.dayOfWeek]} {c.event1.startTime} — <span className="font-medium">{c.event1.title}</span> 与 <span className="font-medium">{c.event2.title}</span> 时间重叠
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[oklch(0.12_0.025_240)] font-serif">日程总览</h2>
          <p className="text-sm text-[oklch(0.48_0.05_240)] mt-0.5">管理您的课程、考试和会议安排</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleImport}
            disabled={importing}
            className="flex items-center gap-2 bg-[oklch(0.78_0.15_75)] hover:bg-[oklch(0.72_0.15_75)] text-[oklch(0.22_0.06_240)] font-semibold px-4 py-2 rounded-xl text-sm transition-all min-h-[40px] disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
            {importing ? '同步中...' : '同步课表'}
          </button>
          <button
            onClick={() => setShowAddCourse(true)}
            className="flex items-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            添加课程
          </button>
        </div>
      </div>

      {/* Add Course Form */}
      {showAddCourse && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-6">
          <h3 className="font-bold text-[oklch(0.12_0.025_240)] mb-4 font-serif">添加新课程</h3>
          <form onSubmit={handleAddCourse} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">课程名称 *</label>
              <input value={newCourse.name} onChange={e => setNewCourse(p => ({ ...p, name: e.target.value }))}
                placeholder="例：高等数学" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">授课教师</label>
              <input value={newCourse.teacher} onChange={e => setNewCourse(p => ({ ...p, teacher: e.target.value }))}
                placeholder="例：张教授" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">上课地点</label>
              <input value={newCourse.location} onChange={e => setNewCourse(p => ({ ...p, location: e.target.value }))}
                placeholder="例：主楼A101" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">星期</label>
              <select value={newCourse.dayOfWeek} onChange={e => setNewCourse(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all">
                {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">开始时间</label>
              <input type="time" value={newCourse.startTime} onChange={e => setNewCourse(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">结束时间</label>
              <input type="time" value={newCourse.endTime} onChange={e => setNewCourse(p => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddCourse(false)}
                className="px-4 py-2 text-sm text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)] border border-[oklch(0.87_0.02_240)] rounded-xl transition-all">
                取消
              </button>
              <button type="submit"
                className="px-6 py-2 bg-[oklch(0.28_0.07_240)] text-white text-sm font-semibold rounded-xl hover:bg-[oklch(0.32_0.07_240)] transition-all">
                添加课程
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Calendar View Toggle + Navigation */}
      <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-[oklch(0.87_0.02_240)] gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentWeekOffset(p => p - 1)} className="p-1.5 hover:bg-[oklch(0.955_0.008_240)] rounded-lg transition-all">
              <ChevronLeft className="w-4 h-4 text-[oklch(0.48_0.05_240)]" />
            </button>
            <div>
              <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif text-sm">{view === 'week' ? '本周日程' : view === 'day' ? '今日日程' : '月度日程'}</h3>
              <p className="text-xs text-[oklch(0.48_0.05_240)]">{formatWeekRange()}</p>
            </div>
            <button onClick={() => setCurrentWeekOffset(p => p + 1)} className="p-1.5 hover:bg-[oklch(0.955_0.008_240)] rounded-lg transition-all">
              <ChevronRight className="w-4 h-4 text-[oklch(0.48_0.05_240)]" />
            </button>
          </div>
          <div className="flex items-center gap-1 bg-[oklch(0.955_0.008_240)] rounded-xl p-1">
            {(['day', 'week', 'month'] as CalendarView[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  view === v ? 'bg-[oklch(0.28_0.07_240)] text-white shadow-sm' : 'text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)]'
                }`}>
                {v === 'day' ? '日' : v === 'week' ? '周' : '月'}
              </button>
            ))}
          </div>
        </div>

        {/* Week View */}
        {view === 'week' && (
          <div className="overflow-x-auto">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[oklch(0.87_0.02_240)] min-w-[560px]">
              {weekDates.map((date, i) => {
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div key={i} className={`py-3 text-center ${isToday ? 'bg-[oklch(0.28_0.07_240)]/5' : ''}`}>
                    <p className={`text-xs uppercase tracking-wide ${isToday ? 'text-[oklch(0.28_0.07_240)] font-semibold' : 'text-[oklch(0.48_0.05_240)]'}`}>{DAY_LABELS[i]}</p>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${
                      isToday ? 'bg-[oklch(0.28_0.07_240)] text-white' : 'text-[oklch(0.12_0.025_240)]'
                    }`}>{date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            {/* Events Grid */}
            <div className="grid grid-cols-7 min-h-48 p-2 gap-1 min-w-[560px]">
              {Array.from({ length: 7 }, (_, dow) => {
                const dayEvents = getEventsForDay(dow);
                return (
                  <div key={dow} className="space-y-1">
                    {dayEvents.map(ev => {
                      const hasConflict = conflictIds.has(ev.id);
                      return (
                        <div key={ev.id} className={`rounded-lg p-2 text-xs ${
                          hasConflict
                            ? 'bg-red-50 text-red-700'
                            : ev.type === 'meeting'
                            ? 'bg-green-50 text-green-700'
                            : COLOR_MAP[ev.color || 'primary'] || COLOR_MAP.primary
                        }`}>
                          <p className="font-semibold leading-tight truncate">{hasConflict ? '⚠ ' : ''}{ev.title}</p>
                          <p className="text-[10px] opacity-70 mt-0.5">{ev.startTime}{hasConflict ? ' 冲突' : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="p-4 space-y-2">
            {[...todayCourses.map(c => ({ title: c.name, start: c.startTime, end: c.endTime, sub: `${c.location} · ${c.teacher}`, type: 'course' })),
              ...todayMeetings.map(m => ({ title: m.title, start: m.startTime, end: m.endTime, sub: m.location, type: 'meeting' }))]
              .sort((a, b) => a.start.localeCompare(b.start))
              .map((ev, i) => (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                  ev.type === 'meeting' ? 'bg-green-50 border-green-100' : 'bg-[oklch(0.28_0.07_240)]/5 border-[oklch(0.28_0.07_240)]/15'
                }`}>
                  <div className="text-right flex-shrink-0 w-12">
                    <p className={`text-xs font-bold ${ev.type === 'meeting' ? 'text-green-700' : 'text-[oklch(0.28_0.07_240)]'}`}>{ev.start}</p>
                    <p className="text-xs text-[oklch(0.48_0.05_240)]">{ev.end}</p>
                  </div>
                  <div className={`w-0.5 self-stretch rounded-full ${ev.type === 'meeting' ? 'bg-green-500' : 'bg-[oklch(0.28_0.07_240)]'}`} />
                  <div>
                    <p className="text-sm font-semibold text-[oklch(0.12_0.025_240)]">{ev.title}</p>
                    <p className="text-xs text-[oklch(0.48_0.05_240)]">{ev.sub}</p>
                  </div>
                </div>
              ))}
            {todayCourses.length === 0 && todayMeetings.length === 0 && (
              <p className="text-center text-sm text-[oklch(0.48_0.05_240)] py-8">今日暂无安排</p>
            )}
          </div>
        )}

        {/* Month View - simplified grid */}
        {view === 'month' && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAY_LABELS.map(d => <div key={d} className="text-xs text-[oklch(0.48_0.05_240)] font-medium py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }, (_, i) => {
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                const startDow = (monthStart.getDay() + 6) % 7;
                const dayNum = i - startDow + 1;
                const date = new Date(today.getFullYear(), today.getMonth(), dayNum);
                const isCurrentMonth = date.getMonth() === today.getMonth();
                const isToday = date.toDateString() === today.toDateString();
                const dow = (date.getDay() + 6) % 7;
                const hasEvents = isCurrentMonth && getEventsForDay(dow).length > 0;
                return (
                  <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                    isToday ? 'bg-[oklch(0.28_0.07_240)] text-white font-bold' :
                    isCurrentMonth ? 'text-[oklch(0.12_0.025_240)] hover:bg-[oklch(0.955_0.008_240)]' :
                    'text-[oklch(0.87_0.02_240)]'
                  }`}>
                    {isCurrentMonth ? date.getDate() : ''}
                    {hasEvents && !isToday && <div className="w-1 h-1 bg-[oklch(0.78_0.15_75)] rounded-full mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Course List */}
      <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.87_0.02_240)]">
          <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif">课程列表</h3>
          <span className="text-xs text-[oklch(0.48_0.05_240)] bg-[oklch(0.955_0.008_240)] px-3 py-1 rounded-full">{courses.length} 门课程</span>
        </div>
        {courses.length === 0 ? (
          <div className="p-8 text-center">
            <Download className="w-10 h-10 text-[oklch(0.87_0.02_240)] mx-auto mb-3" />
            <p className="text-sm text-[oklch(0.48_0.05_240)]">暂无课程，点击「同步课表」从教务系统导入</p>
          </div>
        ) : (
          <div className="divide-y divide-[oklch(0.87_0.02_240)]">
            {courses.map(course => (
              <div key={course.id} className="flex items-center gap-4 px-6 py-3 hover:bg-[oklch(0.955_0.008_240)] transition-colors group">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  course.color === 'secondary' ? 'bg-[oklch(0.42_0.09_240)]' : 'bg-[oklch(0.28_0.07_240)]'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[oklch(0.12_0.025_240)] truncate">{course.name}</p>
                  <p className="text-xs text-[oklch(0.48_0.05_240)]">{DAY_LABELS[course.dayOfWeek]} {course.startTime}–{course.endTime} · {course.location || '未设置地点'}</p>
                </div>
                {course.teacher && <span className="text-xs text-[oklch(0.48_0.05_240)] hidden sm:block">{course.teacher}</span>}
                {course.isImported && <span className="text-xs bg-[oklch(0.28_0.07_240)]/10 text-[oklch(0.28_0.07_240)] px-2 py-0.5 rounded-full">已导入</span>}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEditCourse(course)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[oklch(0.28_0.07_240)]/10 rounded-lg transition-all text-[oklch(0.28_0.07_240)]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    disabled={deletingId === course.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 rounded-lg transition-all text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* School Login Form */}
      {showSchoolLogin && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[oklch(0.12_0.025_240)] font-serif">学校信息门户登录</h3>
            <button 
              onClick={() => setShowSupportedSchools(!showSupportedSchools)}
              className="text-sm text-[oklch(0.28_0.07_240)] hover:text-[oklch(0.32_0.07_240)] font-medium"
            >
              {showSupportedSchools ? '隐藏支持的高校' : '查看支持的高校'}
            </button>
          </div>
          
          {showSupportedSchools && (
            <div className="mb-4 p-3 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl">
              <h4 className="text-sm font-semibold text-[oklch(0.12_0.025_240)] mb-2">已支持的高校：</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {supportedSchools.map((school, index) => (
                  <div key={index} className="text-xs text-[oklch(0.48_0.05_240)]">
                    • {school}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <form onSubmit={handleSchoolLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">学校名称 *</label>
              <input value={school} onChange={e => setSchool(e.target.value)}
                placeholder="例：北京大学" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">用户名 *</label>
              <input value={schoolUsername} onChange={e => setSchoolUsername(e.target.value)}
                placeholder="例：20220101" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">密码 *</label>
              <input type="password" value={schoolPassword} onChange={e => setSchoolPassword(e.target.value)}
                placeholder="请输入信息门户密码" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowSchoolLogin(false)}
                className="px-4 py-2 text-sm text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)] border border-[oklch(0.87_0.02_240)] rounded-xl transition-all">
                取消
              </button>
              <button type="submit" disabled={loginLoading}
                className="px-6 py-2 bg-[oklch(0.28_0.07_240)] text-white text-sm font-semibold rounded-xl hover:bg-[oklch(0.32_0.07_240)] transition-all disabled:opacity-60">
                {loginLoading ? '登录中...' : '登录并导入课表'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Course Form */}
      {showEditCourse && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-6">
          <h3 className="font-bold text-[oklch(0.12_0.025_240)] mb-4 font-serif">编辑课程</h3>
          <form onSubmit={handleSaveEdit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">课程名称 *</label>
              <input value={editCourse.name} onChange={e => setEditCourse(p => ({ ...p, name: e.target.value }))}
                placeholder="例：高等数学" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">授课教师</label>
              <input value={editCourse.teacher} onChange={e => setEditCourse(p => ({ ...p, teacher: e.target.value }))}
                placeholder="例：张教授" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">上课地点</label>
              <input value={editCourse.location} onChange={e => setEditCourse(p => ({ ...p, location: e.target.value }))}
                placeholder="例：主楼A101" className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">星期</label>
              <select value={editCourse.dayOfWeek} onChange={e => setEditCourse(p => ({ ...p, dayOfWeek: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all">
                {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">开始时间</label>
              <input type="time" value={editCourse.startTime} onChange={e => setEditCourse(p => ({ ...p, startTime: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">结束时间</label>
              <input type="time" value={editCourse.endTime} onChange={e => setEditCourse(p => ({ ...p, endTime: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowEditCourse(false)}
                className="px-4 py-2 text-sm text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)] border border-[oklch(0.87_0.02_240)] rounded-xl transition-all">
                取消
              </button>
              <button type="submit"
                className="px-6 py-2 bg-[oklch(0.28_0.07_240)] text-white text-sm font-semibold rounded-xl hover:bg-[oklch(0.32_0.07_240)] transition-all">
                保存修改
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
