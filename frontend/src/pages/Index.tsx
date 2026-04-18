import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';
import OmniflowBadge from '@/components/custom/OmniflowBadge';
import ScheduleView from '@/components/custom/ScheduleView';
import ExamView from '@/components/custom/ExamView';
import MeetingView from '@/components/custom/MeetingView';
import NotificationView from '@/components/custom/NotificationView';
import { coursesApi, examsApi, meetingsApi, notificationsApi } from '@/lib/api';
import type { Course, Exam, Meeting, Notification, ViewType } from '@/types';
import {
  CalendarDays, BookOpen, Users, Bell, LayoutDashboard,
  Menu, X, LogOut, RefreshCw, AlertTriangle, ChevronRight, Plus,
} from 'lucide-react';
import { toast } from 'sonner';

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'schedule', label: '日程总览', icon: <CalendarDays className="w-5 h-5" /> },
  { id: 'exams', label: '考试提醒', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'meetings', label: '会议管理', icon: <Users className="w-5 h-5" /> },
  { id: 'notifications', label: '通知设置', icon: <Bell className="w-5 h-5" /> },
];

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export default function Index() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [cRes, eRes, mRes, nRes] = await Promise.all([
        coursesApi.getAll(),
        examsApi.getAll(),
        meetingsApi.getAll(),
        notificationsApi.getAll(),
      ]);
      if (cRes.success) setCourses(cRes.data);
      if (eRes.success) setExams(eRes.data);
      if (mRes.success) setMeetings(mRes.data);
      if (nRes.success) setNotifications(nRes.data);
    } catch {
      toast.error('数据加载失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleImport = () => {
    // 这里应该打开学校信息门户登录表单
    // 实际的导入逻辑在 ScheduleView 组件中实现
    toast.info('请在日程总览页面中导入课表');
  };

  // Compute conflicts
  const scheduleEvents = [
    ...courses.map(c => ({ id: c.id, title: c.name, dayOfWeek: c.dayOfWeek, startTime: c.startTime, endTime: c.endTime })),
    ...meetings.filter(m => m.status === 'active').map(m => {
      const d = new Date(m.meetingDate);
      const dow = (d.getDay() + 6) % 7;
      return { id: m.id, title: m.title, dayOfWeek: dow, startTime: m.startTime, endTime: m.endTime || m.startTime };
    }),
  ];
  const conflicts: { title1: string; title2: string; day: string }[] = [];
  for (let i = 0; i < scheduleEvents.length; i++) {
    for (let j = i + 1; j < scheduleEvents.length; j++) {
      const a = scheduleEvents[i], b = scheduleEvents[j];
      if (a.dayOfWeek !== b.dayOfWeek) continue;
      const aS = timeToMinutes(a.startTime), aE = timeToMinutes(a.endTime);
      const bS = timeToMinutes(b.startTime), bE = timeToMinutes(b.endTime);
      if (aS < bE && aE > bS) {
        conflicts.push({ title1: a.title, title2: b.title, day: DAY_LABELS[a.dayOfWeek] });
      }
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const activeMeetings = meetings.filter(m => m.status === 'active');
  const today = new Date();
  const todayDow = (today.getDay() + 6) % 7;
  const todayCourses = courses.filter(c => c.dayOfWeek === todayDow);
  const todayMeetings = meetings.filter(m => {
    const d = new Date(m.meetingDate);
    return d.toDateString() === today.toDateString() && m.status === 'active';
  });

  const upcomingExams = exams
    .filter(e => e.status !== 'completed')
    .sort((a, b) => a.examDate.localeCompare(b.examDate))
    .slice(0, 3);

  const getDaysUntil = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const navTo = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[oklch(0.955_0.008_240)] flex flex-col">
      {/* Navbar */}
      <nav className="bg-[oklch(0.28_0.07_240)] shadow-lg sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[oklch(0.78_0.15_75)] rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[oklch(0.22_0.06_240)]" />
              </div>
              <span className="font-serif text-xl font-bold text-white tracking-tight">CampusSync</span>
              <span className="hidden sm:inline-block text-xs text-white/50 uppercase tracking-widest ml-1">学习日程提醒</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => navTo(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                    currentView === item.id
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}>
                  {item.icon}
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="w-4 h-4 bg-[oklch(0.78_0.15_75)] text-[oklch(0.22_0.06_240)] text-[10px] font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              <button onClick={() => navTo('notifications')}
                className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all md:hidden">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[oklch(0.78_0.15_75)] rounded-full" />}
              </button>
              <button onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">退出</span>
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[oklch(0.28_0.07_240)]">
            <div className="px-4 py-3 space-y-1">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => navTo(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${
                    currentView === item.id
                      ? 'bg-white/15 text-white font-semibold'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}>
                  {item.icon}
                  {item.label}
                  {item.id === 'notifications' && unreadCount > 0 && (
                    <span className="ml-auto w-5 h-5 bg-[oklch(0.78_0.15_75)] text-[oklch(0.22_0.06_240)] text-xs font-bold rounded-full flex items-center justify-center">{unreadCount}</span>
                  )}
                </button>
              ))}
              <button onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
                退出登录
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Conflict Alert Banner */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                <span className="font-semibold">检测到日程冲突：</span>
                {conflicts[0].day} — <span className="font-semibold">{conflicts[0].title1}</span> 与 <span className="font-semibold">{conflicts[0].title2}</span> 时间重叠
                {conflicts.length > 1 && ` 等 ${conflicts.length} 个冲突`}
              </p>
            </div>
            <button onClick={() => navTo('schedule')}
              className="text-xs font-semibold text-amber-700 hover:underline flex-shrink-0 flex items-center gap-1">
              查看日程 <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Hero Section (Dashboard only) */}
      {currentView === 'dashboard' && (
        <section className="bg-[oklch(0.28_0.07_240)] relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[oklch(0.78_0.15_75)] rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[oklch(0.42_0.09_240)] rounded-full translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[oklch(0.78_0.15_75)]/20 border border-[oklch(0.78_0.15_75)]/40 rounded-full px-3 py-1 mb-4">
                  <span className="w-1.5 h-1.5 bg-[oklch(0.78_0.15_75)] rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-[oklch(0.78_0.15_75)] uppercase tracking-widest">2026春季学期</span>
                </div>
                <h1 className="font-serif text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                  一站式学习<br />
                  <span className="text-[oklch(0.78_0.15_75)]">日程管理</span>平台
                </h1>
                <p className="text-white/70 text-base leading-relaxed mb-6">
                  自动同步教务系统课表，智能提醒四六级考试，高效管理班级与社团会议。
                </p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleImport} disabled={importing}
                    className="flex items-center gap-2 bg-[oklch(0.78_0.15_75)] hover:bg-[oklch(0.72_0.15_75)] text-[oklch(0.22_0.06_240)] font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-[1.02] shadow-lg disabled:opacity-60 min-h-[44px]">
                    <RefreshCw className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                    {importing ? '同步中...' : '一键导入课表'}
                  </button>
                  <button onClick={() => navTo('meetings')}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-2.5 rounded-xl border border-white/20 transition-all min-h-[44px]">
                    <Users className="w-4 h-4" />
                    新建会议
                  </button>
                </div>
              </div>

              {/* Import Status Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif text-white font-semibold">教务系统课表导入</h3>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                    courses.length > 0
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : 'bg-white/10 text-white/60 border-white/20'
                  }`}>
                    {courses.length > 0 ? '已连接' : '未导入'}
                  </span>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                    <div className="w-9 h-9 bg-[oklch(0.42_0.09_240)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">南京审计大学教务系统</p>
                      <p className="text-white/50 text-xs">上次同步：{loading ? '加载中...' : courses.length > 0 ? '已同步' : '未同步'}</p>
                    </div>
                    {courses.length > 0 && (
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-white font-serif">{courses.length}</p>
                      <p className="text-xs text-white/50 mt-0.5">门课程</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-[oklch(0.78_0.15_75)] font-serif">{exams.length}</p>
                      <p className="text-xs text-white/50 mt-0.5">场考试</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-2xl font-bold text-white font-serif">{activeMeetings.length}</p>
                      <p className="text-xs text-white/50 mt-0.5">个会议</p>
                    </div>
                  </div>
                </div>
                <button onClick={handleImport} disabled={importing}
                  className="w-full flex items-center justify-center gap-2 bg-[oklch(0.78_0.15_75)] hover:bg-[oklch(0.72_0.15_75)] text-[oklch(0.22_0.06_240)] font-bold py-2.5 rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60">
                  <RefreshCw className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                  刷新同步课表
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-[oklch(0.28_0.07_240)] mx-auto mb-3" />
              <p className="text-sm text-[oklch(0.48_0.05_240)]">加载中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard View */}
            {currentView === 'dashboard' && (
              <div className="space-y-6">
                {/* Stats Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-[oklch(0.87_0.02_240)] shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-[oklch(0.28_0.07_240)]/10 rounded-xl flex items-center justify-center">
                        <CalendarDays className="w-5 h-5 text-[oklch(0.28_0.07_240)]" />
                      </div>
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">本周</span>
                    </div>
                    <p className="text-3xl font-bold font-serif text-[oklch(0.12_0.025_240)]">{courses.filter(c => c.dayOfWeek <= 4).length}</p>
                    <p className="text-sm text-[oklch(0.48_0.05_240)] mt-1">节课程安排</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[oklch(0.87_0.02_240)] shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-[oklch(0.78_0.15_75)]/15 rounded-xl flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-[oklch(0.78_0.15_75)]" />
                      </div>
                      <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                        {upcomingExams.length > 0 ? `${getDaysUntil(upcomingExams[0].examDate)}天后` : '无'}
                      </span>
                    </div>
                    <p className="text-3xl font-bold font-serif text-[oklch(0.12_0.025_240)]">{exams.filter(e => e.status !== 'completed').length}</p>
                    <p className="text-sm text-[oklch(0.48_0.05_240)] mt-1">场考试提醒</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[oklch(0.87_0.02_240)] shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-[oklch(0.42_0.09_240)]/10 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-[oklch(0.42_0.09_240)]" />
                      </div>
                      <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">本月</span>
                    </div>
                    <p className="text-3xl font-bold font-serif text-[oklch(0.12_0.025_240)]">{activeMeetings.length}</p>
                    <p className="text-sm text-[oklch(0.48_0.05_240)] mt-1">个会议安排</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-[oklch(0.87_0.02_240)] shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        conflicts.length > 0 ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'
                      }`}>{conflicts.length > 0 ? '需处理' : '无冲突'}</span>
                    </div>
                    <p className="text-3xl font-bold font-serif text-[oklch(0.12_0.025_240)]">{conflicts.length}</p>
                    <p className="text-sm text-[oklch(0.48_0.05_240)] mt-1">日程冲突</p>
                  </div>
                </div>

                {/* Main Grid */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Left: Today + Upcoming Exams */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* Today's Schedule */}
                    <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between">
                        <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">今日日程</h3>
                        <span className="text-xs text-[oklch(0.48_0.05_240)]">
                          {today.getMonth() + 1}月{today.getDate()}日 {['\u5468\u65e5', '\u5468\u4e00', '\u5468\u4e8c', '\u5468\u4e09', '\u5468\u56db', '\u5468\u4e94', '\u5468\u516d'][today.getDay()]}
                        </span>
                      </div>
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
                          <p className="text-center text-sm text-[oklch(0.48_0.05_240)] py-6">今日暂无安排</p>
                        )}
                      </div>
                    </div>

                    {/* Upcoming Exams */}
                    <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-[oklch(0.87_0.02_240)]">
                        <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">即将到来的考试</h3>
                        <button onClick={() => navTo('exams')}
                          className="text-xs font-semibold text-[oklch(0.42_0.09_240)] hover:text-[oklch(0.28_0.07_240)] flex items-center gap-1 transition-colors">
                          查看全部 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {upcomingExams.length === 0 ? (
                          <p className="text-center text-sm text-[oklch(0.48_0.05_240)] py-6">暂无即将到来的考试</p>
                        ) : upcomingExams.map(exam => {
                          const days = getDaysUntil(exam.examDate);
                          return (
                            <div key={exam.id} className="flex items-start gap-4 p-4 bg-[oklch(0.955_0.008_240)] rounded-xl border border-[oklch(0.87_0.02_240)] hover:border-[oklch(0.28_0.07_240)]/40 hover:shadow-sm transition-all cursor-pointer"
                              onClick={() => navTo('exams')}>
                              <div className="w-11 h-11 bg-[oklch(0.28_0.07_240)] rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-xs font-serif">
                                  {exam.examType === 'CET4' ? '四级' : exam.examType === 'CET6' ? '六级' :
                                   exam.examType === 'NCRE1' ? '一级' : exam.examType === 'NCRE2' ? '二级' : '自定义'}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-[oklch(0.12_0.025_240)] text-sm">{exam.name}</h4>
                                  {days > 0 && days <= 30 && (
                                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">{days}天后</span>
                                  )}
                                </div>
                                <p className="text-xs text-[oklch(0.48_0.05_240)] mb-2">考试日期：{exam.examDate}</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 bg-[oklch(0.87_0.02_240)] rounded-full h-1.5">
                                    <div className="bg-[oklch(0.28_0.07_240)] h-1.5 rounded-full" style={{ width: `${exam.prepProgress}%` }} />
                                  </div>
                                  <span className="text-xs text-[oklch(0.48_0.05_240)] flex-shrink-0">备考 {exam.prepProgress}%</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button onClick={() => navTo('exams')}
                          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-[oklch(0.87_0.02_240)] rounded-xl text-sm text-[oklch(0.48_0.05_240)] hover:border-[oklch(0.28_0.07_240)]/40 hover:text-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.28_0.07_240)]/5 transition-all">
                          <Plus className="w-4 h-4" />
                          添加考试提醒（CET-4、计算机一级等）
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Sidebar */}
                  <div className="space-y-5">
                    {/* Notifications */}
                    <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between">
                        <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">提醒通知</h3>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-[oklch(0.28_0.07_240)] text-white px-2 py-0.5 rounded-full font-medium">{unreadCount}条新</span>
                        )}
                      </div>
                      <div className="divide-y divide-[oklch(0.87_0.02_240)]">
                        {notifications.slice(0, 4).map(n => (
                          <div key={n.id} className={`flex items-start gap-3 p-4 hover:bg-[oklch(0.955_0.008_240)] transition-colors ${
                            !n.isRead ? 'bg-[oklch(0.28_0.07_240)]/3' : ''
                          }`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                              n.type === 'conflict' ? 'bg-red-50 text-red-600' :
                              n.type === 'exam_reminder' ? 'bg-amber-50 text-amber-600' :
                              n.type === 'sync_success' ? 'bg-green-50 text-green-600' :
                              'bg-[oklch(0.28_0.07_240)]/10 text-[oklch(0.28_0.07_240)]'
                            }`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm text-[oklch(0.12_0.025_240)] ${!n.isRead ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                              <p className="text-xs text-[oklch(0.48_0.05_240)] mt-0.5 line-clamp-2">{n.message}</p>
                            </div>
                          </div>
                        ))}
                        {notifications.length === 0 && (
                          <p className="text-center text-sm text-[oklch(0.48_0.05_240)] py-6">暂无通知</p>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <div className="px-5 py-3 border-t border-[oklch(0.87_0.02_240)]">
                          <button onClick={() => navTo('notifications')}
                            className="text-xs font-semibold text-[oklch(0.42_0.09_240)] hover:text-[oklch(0.28_0.07_240)] flex items-center gap-1 transition-colors">
                            查看全部通知 <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Upcoming Meetings */}
                    <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between">
                        <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">近期会议</h3>
                        <button onClick={() => navTo('meetings')}
                          className="text-xs font-semibold text-[oklch(0.42_0.09_240)] hover:text-[oklch(0.28_0.07_240)] flex items-center gap-1 transition-colors">
                          查看全部 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {activeMeetings.slice(0, 4).map(m => {
                          const confirmedCount = m.rsvps.filter(r => r.status === 'confirmed').length;
                          return (
                            <div key={m.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => navTo('meetings')}>
                              <div className="w-10 h-10 bg-[oklch(0.28_0.07_240)]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 text-[oklch(0.28_0.07_240)]" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[oklch(0.12_0.025_240)] group-hover:text-[oklch(0.28_0.07_240)] transition-colors truncate">{m.title}</p>
                                <p className="text-xs text-[oklch(0.48_0.05_240)]">{m.meetingDate} {m.startTime}{m.location ? ` · ${m.location}` : ''}</p>
                              </div>
                              {confirmedCount > 0 && (
                                <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">{confirmedCount}人确认</span>
                              )}
                            </div>
                          );
                        })}
                        {activeMeetings.length === 0 && (
                          <p className="text-center text-sm text-[oklch(0.48_0.05_240)] py-4">暂无会议安排</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentView === 'schedule' && (
              <ScheduleView
                courses={courses}
                meetings={meetings}
                exams={exams}
                onCoursesChange={fetchAll}
              />
            )}

            {currentView === 'exams' && (
              <ExamView exams={exams} onExamsChange={fetchAll} />
            )}

            {currentView === 'meetings' && (
              <MeetingView meetings={meetings} onMeetingsChange={fetchAll} />
            )}

            {currentView === 'notifications' && (
              <NotificationView notifications={notifications} onNotificationsChange={fetchAll} />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[oklch(0.28_0.07_240)] mt-8">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-[oklch(0.78_0.15_75)] rounded-lg flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-[oklch(0.22_0.06_240)]" />
              </div>
              <span className="font-serif text-white font-bold">CampusSync</span>
              <span className="text-white/40 text-sm">学习日程提醒系统 v1.0</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors">隐私政策</span>
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors">使用条款</span>
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors">帮助中心</span>
            </div>
            <p className="text-xs text-white/30">© 2026 CampusSync · 马垠凡</p>
          </div>
        </div>
      </footer>

      <OmniflowBadge />
      <Toaster />
    </div>
  );
}


