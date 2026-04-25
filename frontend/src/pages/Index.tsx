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
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);

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

                    {/* AI Personalized Learning Assistant */}
                    <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                      <div className="px-5 py-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between">
                        <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">AI个性化学习辅助</h3>
                        <div className="w-6 h-6 bg-[oklch(0.78_0.15_75)]/15 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-[oklch(0.78_0.15_75)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="p-4 space-y-4">
                        {(() => {
                          // Generate AI learning suggestions based on courses and exams
                          const suggestions = [];
                          
                          // Check if there are any courses
                          if (courses.length > 0) {
                            // Count courses per day
                            const coursesPerDay = courses.reduce((acc, course) => {
                              acc[course.dayOfWeek] = (acc[course.dayOfWeek] || 0) + 1;
                              return acc;
                            }, {} as Record<number, number>);
                            
                            // Find day with most courses
                            const busiestDay = Object.entries(coursesPerDay).reduce((max, [day, count]) => 
                              count > (max.count || 0) ? { day: parseInt(day), count } : max
                            , { day: 0, count: 0 });
                            
                            if (busiestDay.count > 1) {
                              suggestions.push({
                                type: 'warning',
                                message: `您${DAY_LABELS[busiestDay.day]}有${busiestDay.count}门课程，建议提前准备学习材料。`
                              });
                            }
                            
                            // Check for evening courses
                            const eveningCourses = courses.filter(c => {
                              const hour = parseInt(c.startTime.split(':')[0]);
                              return hour >= 18;
                            });
                            
                            if (eveningCourses.length > 0) {
                              suggestions.push({
                                type: 'info',
                                message: `您有${eveningCourses.length}门晚间课程，建议合理安排白天的学习时间。`
                              });
                            }
                          }
                          
                          // Check if there are any exams
                          if (upcomingExams.length > 0) {
                            const closestExam = upcomingExams[0];
                            const daysUntil = getDaysUntil(closestExam.examDate);
                            
                            if (daysUntil <= 7) {
                              suggestions.push({
                                type: 'warning',
                                message: `${closestExam.name}将在${daysUntil}天后进行，建议加强复习。`
                              });
                            } else if (daysUntil <= 30) {
                              suggestions.push({
                                type: 'info',
                                message: `${closestExam.name}将在${daysUntil}天后进行，建议开始系统复习。`
                              });
                            }
                          }
                          
                          // General suggestions
                          if (courses.length === 0) {
                            suggestions.push({
                              type: 'info',
                              message: '请导入课表以获取个性化学习建议。'
                            });
                          } else if (exams.length === 0) {
                            suggestions.push({
                              type: 'info',
                              message: '建议添加考试提醒以获得更全面的学习规划。'
                            });
                          } else {
                            suggestions.push({
                              type: 'success',
                              message: '根据您的课表和考试安排，建议制定每周学习计划，合理分配复习时间。'
                            });
                          }
                          
                          return suggestions;
                        })().map((suggestion, index) => (
                          <div key={index} className={`flex items-start gap-3 p-3 rounded-xl border ${suggestion.type === 'warning' ? 'bg-amber-50 border-amber-100' : suggestion.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${suggestion.type === 'warning' ? 'bg-amber-100 text-amber-600' : suggestion.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                              {suggestion.type === 'warning' ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : suggestion.type === 'success' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </div>
                            <p className="text-sm text-[oklch(0.12_0.025_240)]">{suggestion.message}</p>
                          </div>
                        ))}
                        
                        {/* Chat Button */}
                        <button
                          onClick={() => {
                            // Close any existing chat containers
                            const existingChats = document.querySelectorAll('.chat-container');
                            existingChats.forEach(chat => chat.remove());
                            
                            const chatContainer = document.createElement('div');
                            chatContainer.className = 'chat-container fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
                            chatContainer.innerHTML = `
                              <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-sm border border-[oklch(0.87_0.02_240)]">
                                <div className="p-4 border-b border-[oklch(0.87_0.02_240)] flex items-center justify-between bg-white">
                                  <h3 className="font-serif font-bold text-[oklch(0.12_0.025_240)]">AI学习助手</h3>
                                  <button class="close-btn text-[oklch(0.48_0.05_240)] hover:text-[oklch(0.12_0.025_240)] p-2 rounded-full hover:bg-[oklch(0.955_0.008_240)] transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                                <div class="chat-messages flex-1 p-4 overflow-y-auto space-y-4 bg-white" id="chat-messages">
                                  <div class="flex gap-3">
                                    <div class="w-8 h-8 bg-[oklch(0.78_0.15_75)] rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                    </div>
                                    <div class="bg-[oklch(0.955_0.008_240)] rounded-xl p-3 max-w-[80%]">
                                      <p class="text-sm">你好！我是你的AI学习助手。我可以帮你解决日期安排问题，提供学习方法建议。请问有什么可以帮助你的？</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="p-4 border-t border-[oklch(0.87_0.02_240)] bg-white">
                                  <div className="flex gap-2">
                                    <input type="text" placeholder="输入你的问题..." class="flex-1 border border-[oklch(0.87_0.02_240)] rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.15_75)] focus:border-transparent" id="chat-input" />
                                    <button class="send-btn bg-[oklch(0.78_0.15_75)] hover:bg-[oklch(0.72_0.15_75)] text-white rounded-xl px-4 py-2 transition-colors">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            `;
                            
                            document.body.appendChild(chatContainer);
                            
                            // Close button functionality
                            const closeBtn = chatContainer.querySelector('.close-btn');
                            if (closeBtn) {
                              closeBtn.addEventListener('click', () => {
                                chatContainer.remove();
                              });
                            }
                            
                            // Also allow clicking outside the chat box to close it
                            chatContainer.addEventListener('click', (e) => {
                              if (e.target === chatContainer) {
                                chatContainer.remove();
                              }
                            });
                            
                            // Send button functionality
                            const sendBtn = chatContainer.querySelector('.send-btn');
                            const chatInput = chatContainer.querySelector('#chat-input') as HTMLInputElement;
                            const chatMessages = chatContainer.querySelector('#chat-messages');
                            
                            const sendMessage = () => {
                              const message = chatInput.value.trim();
                              if (message) {
                                // Add user message
                                const userMessageHTML = `
                                  <div class="flex gap-3 justify-end">
                                    <div class="bg-[oklch(0.78_0.15_75)] text-white rounded-xl p-3 max-w-[80%]">
                                      <p class="text-sm">${message}</p>
                                    </div>
                                    <div class="w-8 h-8 bg-[oklch(0.28_0.07_240)] rounded-full flex items-center justify-center flex-shrink-0">
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                  </div>
                                `;
                                chatMessages?.insertAdjacentHTML('beforeend', userMessageHTML);
                                
                                // Clear input
                                chatInput.value = '';
                                
                                // Scroll to bottom
                                if (chatMessages) {
                                  chatMessages.scrollTop = chatMessages.scrollHeight;
                                }
                                
                                // Simulate AI response
                                setTimeout(() => {
                                  let response = '';
                                  
                                  // Parse user request for specific requirements
                                  const hasWordLimit = message.includes('字') || message.includes('简短');
                                  const requestedWords = message.match(/(\d+)字/);
                                  const wordLimit = requestedWords ? parseInt(requestedWords[1]) : 0;
                                  
                                  // Analyze user request
                                  const lowerMessage = message.toLowerCase();
                                  
                                  // Analyze courses data
                                  const coursesPerDay: Record<number, string[]> = {};
                                  courses.forEach(c => {
                                    if (!coursesPerDay[c.dayOfWeek]) {
                                      coursesPerDay[c.dayOfWeek] = [];
                                    }
                                    coursesPerDay[c.dayOfWeek].push(c.name);
                                  });
                                  
                                  // Find busiest day
                                  let busiestDay = 0;
                                  let busiestCount = 0;
                                  Object.entries(coursesPerDay).forEach(([day, courseList]) => {
                                    if (courseList.length > busiestCount) {
                                      busiestCount = courseList.length;
                                      busiestDay = parseInt(day);
                                    }
                                  });
                                  
                                  // Analyze exams
                                  const upcomingExamsSorted = [...exams]
                                    .filter(e => e.status !== 'completed')
                                    .sort((a, b) => a.examDate.localeCompare(b.examDate));
                                  
                                  // Generate personalized response
                                  if (lowerMessage.includes('分析') || lowerMessage.includes('学习日程') || lowerMessage.includes('课表')) {
                                    if (courses.length === 0) {
                                      response = '请先导入你的课表，这样我可以为你分析学习日程。';
                                    } else {
                                      response = `根据你的课表分析：\n\n`;
                                      response += `• 你本周共有${courses.length}门课程\n`;
                                      response += `• 最忙碌的是${DAY_LABELS[busiestDay]}，有${busiestCount}门课程\n`;
                                      
                                      // List courses for busiest day
                                      const busiestCourses = coursesPerDay[busiestDay] || [];
                                      if (busiestCourses.length > 0) {
                                        response += `• ${DAY_LABELS[busiestDay]}的课程包括：${busiestCourses.join('、')}\n`;
                                      }
                                      
                                      // Check evening courses
                                      const eveningCourses = courses.filter(c => {
                                        const hour = parseInt(c.startTime.split(':')[0]);
                                        return hour >= 18;
                                      });
                                      if (eveningCourses.length > 0) {
                                        response += `• 你有${eveningCourses.length}门晚间课程，建议合理安排白天学习时间\n`;
                                      }
                                      
                                      response += `\n建议：利用周末时间复习本周内容，特别是${busiestCourses.slice(0, 2).join('和')}这两门课程。`;
                                    }
                                  } else if (lowerMessage.includes('时间') || lowerMessage.includes('安排')) {
                                    if (courses.length === 0) {
                                      response = '请先导入你的课表，这样我可以为你提供更准确的时间安排建议。';
                                    } else {
                                      response = `根据你的课表，我建议以下时间安排：\n\n`;
                                      response += `• 优先安排${DAY_LABELS[busiestDay]}的学习，那天有${busiestCount}门课程\n`;
                                      response += `• 每天课后花30分钟复习当天内容\n`;
                                      response += `• 周末安排2-3小时进行本周内容总结\n`;
                                      
                                      if (upcomingExamsSorted.length > 0) {
                                        const nextExam = upcomingExamsSorted[0];
                                        const daysUntil = getDaysUntil(nextExam.examDate);
                                        response += `• ${nextExam.name}将在${daysUntil}天后，建议每天安排1小时复习\n`;
                                      }
                                      
                                      response += `\n保持规律作息，确保充足睡眠，学习效率会更高。`;
                                    }
                                  } else if (lowerMessage.includes('复习') || lowerMessage.includes('考试')) {
                                    if (exams.length === 0) {
                                      response = '建议你添加考试提醒，这样我可以为你制定详细的复习计划。';
                                    } else {
                                      response = `根据你的考试安排，建议以下复习计划：\n\n`;
                                      upcomingExamsSorted.forEach((exam, index) => {
                                        const daysUntil = getDaysUntil(exam.examDate);
                                        if (daysUntil > 0) {
                                          response += `• ${exam.name}（${exam.examDate}）：剩余${daysUntil}天\n`;
                                          response += `  - 每天复习${Math.ceil(100 / daysUntil)}%的内容\n`;
                                          response += `  - 考前3天进行模拟测试\n`;
                                        }
                                      });
                                      response += `\n建议：将大任务分解为小目标，每天完成一部分，避免考前突击。`;
                                    }
                                  } else if (lowerMessage.includes('学习方法') || lowerMessage.includes('如何学习') || lowerMessage.includes('建议')) {
                                    if (courses.length === 0) {
                                      response = '请先导入课表，这样我可以提供针对性的学习方法建议。';
                                    } else {
                                      // Get unique course types
                                      const courseNames = courses.map(c => c.name);
                                      const hasProgramming = courseNames.some(n => n.includes('编程') || n.includes('Python') || n.includes('NET') || n.includes('Java'));
                                      const hasTheory = courseNames.some(n => n.includes('概论') || n.includes('思想') || n.includes('原理'));
                                      
                                      response = `根据你的课程特点，建议以下学习方法：\n\n`;
                                      
                                      if (hasProgramming) {
                                        response += `• 编程类课程：多动手实践，每天至少写30分钟代码，通过项目巩固知识\n`;
                                      }
                                      if (hasTheory) {
                                        response += `• 理论类课程：制作思维导图，定期回顾重点概念，尝试向他人讲解\n`;
                                      }
                                      
                                      response += `• 通用方法：课前预习15分钟，课堂做好笔记，课后24小时内复习\n`;
                                      response += `• 利用碎片时间：通勤路上听相关音频，午休前回顾当天内容\n`;
                                      response += `• 每周日进行知识总结，构建完整的知识体系`;
                                    }
                                  } else {
                                    response = `我是你的AI学习助手，可以帮你：\n\n`;
                                    response += `• 分析学习日程，优化时间安排\n`;
                                    response += `• 制定考试复习计划\n`;
                                    response += `• 提供个性化学习方法建议\n\n`;
                                    response += `请告诉我你的具体需求，例如"分析我的学习日程"或"如何复习考试"。`;
                                  }
                                  
                                  // If word limit is specified, truncate response
                                  if (wordLimit > 0 && response.length > wordLimit) {
                                    // Find a good breaking point
                                    let breakPoint = response.lastIndexOf('。', wordLimit);
                                    if (breakPoint === -1) {
                                      breakPoint = response.lastIndexOf('\n', wordLimit);
                                    }
                                    if (breakPoint === -1) {
                                      breakPoint = wordLimit;
                                    }
                                    response = response.substring(0, breakPoint + 1);
                                  }
                                  
                                  const aiMessageHTML = `
                                    <div class="flex gap-3">
                                      <div class="w-8 h-8 bg-[oklch(0.78_0.15_75)] rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                      </div>
                                      <div class="bg-[oklch(0.955_0.008_240)] rounded-xl p-3 max-w-[80%]">
                                        <p class="text-sm whitespace-pre-line">${response}</p>
                                      </div>
                                    </div>
                                  `;
                                  chatMessages?.insertAdjacentHTML('beforeend', aiMessageHTML);
                                  
                                  // Scroll to bottom
                                  if (chatMessages) {
                                    chatMessages.scrollTop = chatMessages.scrollHeight;
                                  }
                                }, 1000);
                              }
                            };
                            
                            sendBtn?.addEventListener('click', sendMessage);
                            
                            // Enter key functionality
                            chatInput?.addEventListener('keypress', (e) => {
                              if (e.key === 'Enter') {
                                sendMessage();
                              }
                            });
                          }}
                          className="w-full py-3 bg-[oklch(0.955_0.008_240)] hover:bg-[oklch(0.92_0.01_240)] rounded-xl border border-[oklch(0.87_0.02_240)] flex items-center justify-center gap-2 text-sm font-medium text-[oklch(0.28_0.07_240)] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          与AI交流
                        </button>
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
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors" onClick={() => setShowPrivacyPolicy(true)}>隐私政策</span>
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors" onClick={() => setShowTermsOfService(true)}>使用条款</span>
              <span className="text-sm text-white/50 cursor-pointer hover:text-white/80 transition-colors" onClick={() => setShowHelpCenter(true)}>帮助中心</span>
            </div>
            <p className="text-xs text-white/30">© 2026 CampusSync · 马垠凡</p>
          </div>
        </div>
      </footer>

      <OmniflowBadge />
      <Toaster />

      {/* 隐私政策模态框 */}
      {showPrivacyPolicy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">隐私政策</h2>
              <button 
                onClick={() => setShowPrivacyPolicy(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. 隐私政策概述</h3>
              <p className="text-gray-600 mb-4">
                CampusSync（以下简称"我们"）致力于保护用户的隐私和个人信息。本隐私政策描述了我们如何收集、使用、存储和保护您的个人信息，以及您对这些信息的权利。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. 信息收集</h3>
              <p className="text-gray-600 mb-4">
                我们收集以下类型的信息：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>个人身份信息：姓名、邮箱地址、学号等</li>
                <li>课程信息：通过学校信息门户导入的课程表</li>
                <li>考试信息：用户添加的考试提醒</li>
                <li>会议信息：用户添加的会议安排</li>
                <li>使用数据：系统使用频率、访问时间等</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. 信息使用</h3>
              <p className="text-gray-600 mb-4">
                我们使用收集的信息：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>提供和改进我们的服务</li>
                <li>发送重要通知和提醒</li>
                <li>分析使用情况以优化系统</li>
                <li>提供个性化的学习建议</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">4. 信息保护</h3>
              <p className="text-gray-600 mb-4">
                我们采取以下措施保护您的信息：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>使用加密技术保护数据传输</li>
                <li>限制对个人信息的访问权限</li>
                <li>定期备份数据</li>
                <li>实施安全审计和监控</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">5. 信息共享</h3>
              <p className="text-gray-600 mb-4">
                我们不会向第三方共享您的个人信息，除非：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>获得您的明确授权</li>
                <li>法律要求或合规需要</li>
                <li>保护我们的权利、财产或安全</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">6. 您的权利</h3>
              <p className="text-gray-600 mb-4">
                您有权：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>访问和查看您的个人信息</li>
                <li>更正不准确的个人信息</li>
                <li>删除您的个人信息</li>
                <li>限制个人信息的处理</li>
                <li>撤回您的授权</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">7. 隐私政策更新</h3>
              <p className="text-gray-600 mb-4">
                我们可能会不时更新本隐私政策。更新后，我们将在系统中发布新的隐私政策，并通过邮件或系统通知告知您。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">8. 联系我们</h3>
              <p className="text-gray-600 mb-4">
                如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
              </p>
              <p className="text-gray-600 mb-4">
                邮箱：support@campussync.com<br />
                电话：+86 123 4567 8910
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 使用条款模态框 */}
      {showTermsOfService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">使用条款</h2>
              <button 
                onClick={() => setShowTermsOfService(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. 服务条款概述</h3>
              <p className="text-gray-600 mb-4">
                欢迎使用CampusSync学习日程提醒系统（以下简称"本服务"）。本使用条款（以下简称"条款"）构成您与CampusSync之间的法律协议，规定了您使用本服务的权利和义务。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. 用户账户</h3>
              <p className="text-gray-600 mb-4">
                为使用本服务，您需要创建一个用户账户。您同意：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>提供真实、准确、完整的个人信息</li>
                <li>保持账户信息的更新</li>
                <li>对账户下的所有活动负责</li>
                <li>保护账户密码的安全</li>
                <li>在发现账户被未授权使用时立即通知我们</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. 服务使用</h3>
              <p className="text-gray-600 mb-4">
                您可以使用本服务：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>导入和管理课程表</li>
                <li>添加和管理考试提醒</li>
                <li>添加和管理会议安排</li>
                <li>接收学习和考试提醒</li>
                <li>获取AI个性化学习建议</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">4. 禁止行为</h3>
              <p className="text-gray-600 mb-4">
                您不得：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>使用本服务进行任何非法活动</li>
                <li>干扰或破坏本服务的正常运行</li>
                <li>未经授权访问或使用他人账户</li>
                <li>上传或传播恶意软件、病毒或其他有害内容</li>
                <li>侵犯他人的知识产权或其他权利</li>
                <li>滥用本服务或超出合理使用范围</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">5. 知识产权</h3>
              <p className="text-gray-600 mb-4">
                本服务的所有内容、功能和技术，包括但不限于软件、代码、设计、文本、图形、图像、音频、视频和徽标，均为CampusSync或其许可方的知识产权。您不得复制、修改、分发、出售、租赁或以其他方式使用这些内容，除非获得我们的明确书面许可。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">6. 免责声明</h3>
              <p className="text-gray-600 mb-4">
                本服务按"原样"提供，不提供任何形式的担保。我们不保证：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>本服务将完全符合您的要求</li>
                <li>本服务将不间断、及时、安全或无错误</li>
                <li>使用本服务获得的结果将是准确或可靠的</li>
                <li>本服务的任何缺陷将被修正</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">7. 责任限制</h3>
              <p className="text-gray-600 mb-4">
                在法律允许的最大范围内，CampusSync及其员工、董事、供应商和合作伙伴不对任何直接、间接、偶然、特殊或后果性损害承担责任，包括但不限于利润损失、数据损失、商誉损失、替代商品或服务的采购成本，无论这些损害是否基于保证、合同、侵权（包括疏忽）或任何其他法律理论。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">8. 服务修改和终止</h3>
              <p className="text-gray-600 mb-4">
                我们保留随时修改、暂停或终止本服务的权利，无需事先通知。我们也保留随时终止您的账户的权利，如果您违反本条款或我们认为您的使用可能对我们或其他用户造成损害。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">9. 条款更新</h3>
              <p className="text-gray-600 mb-4">
                我们可能会不时更新本条款。更新后，我们将在系统中发布新的条款，并通过邮件或系统通知告知您。继续使用本服务即表示您接受更新后的条款。
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">10. 法律适用</h3>
              <p className="text-gray-600 mb-4">
                本条款受中华人民共和国法律管辖，任何争议应提交至有管辖权的人民法院解决。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 帮助中心模态框 */}
      {showHelpCenter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">帮助中心</h2>
              <button 
                onClick={() => setShowHelpCenter(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">1. 系统功能介绍</h3>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">1.1 课程表导入</h4>
              <p className="text-gray-600 mb-4">
                <strong>功能说明：</strong>通过学校信息门户导入课程表，自动生成学习日程。
              </p>
              <p className="text-gray-600 mb-4">
                <strong>使用方法：</strong>
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>点击"一键导入课表"按钮</li>
                <li>在弹出的窗口中选择您的学校</li>
                <li>输入学校信息门户的用户名和密码</li>
                <li>点击"登录并导入课表"按钮</li>
                <li>等待系统导入课程表，导入完成后会显示成功提示</li>
              </ol>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">1.2 考试提醒</h4>
              <p className="text-gray-600 mb-4">
                <strong>功能说明：</strong>添加和管理考试提醒，系统会在考试前发送通知。
              </p>
              <p className="text-gray-600 mb-4">
                <strong>使用方法：</strong>
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>在"即将到来的考试"模块中，点击"添加考试提醒"按钮</li>
                <li>填写考试名称、日期、时间、地点等信息</li>
                <li>点击"保存"按钮</li>
                <li>系统会自动计算距离考试的天数，并在考试前发送提醒</li>
              </ol>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">1.3 会议管理</h4>
              <p className="text-gray-600 mb-4">
                <strong>功能说明：</strong>添加和管理会议安排，系统会在会议前发送通知。
              </p>
              <p className="text-gray-600 mb-4">
                <strong>使用方法：</strong>
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>点击顶部导航栏中的"会议管理"</li>
                <li>点击"添加会议"按钮</li>
                <li>填写会议名称、日期、时间、地点、参与者等信息</li>
                <li>点击"保存"按钮</li>
                <li>系统会在会议前发送提醒</li>
              </ol>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">1.4 通知设置</h4>
              <p className="text-gray-600 mb-4">
                <strong>功能说明：</strong>设置通知偏好，包括通知方式、时间等。
              </p>
              <p className="text-gray-600 mb-4">
                <strong>使用方法：</strong>
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>点击顶部导航栏中的"通知设置"</li>
                <li>选择您希望接收的通知类型</li>
                <li>设置通知的时间和方式</li>
                <li>点击"保存"按钮</li>
              </ol>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">1.5 AI个性化学习辅助</h4>
              <p className="text-gray-600 mb-4">
                <strong>功能说明：</strong>根据您的课表和考试安排，提供个性化的学习建议和时间安排。
              </p>
              <p className="text-gray-600 mb-4">
                <strong>使用方法：</strong>
              </p>
              <ol className="list-decimal pl-5 text-gray-600 mb-4 space-y-2">
                <li>在仪表盘页面的"AI个性化学习辅助"模块中，点击"与AI交流"按钮</li>
                <li>在聊天窗口中输入您的问题，例如"分析我的学习日程"、"如何安排学习时间？"等</li>
                <li>AI助手会根据您的课表和考试安排生成个性化的建议</li>
                <li>您可以继续与AI助手交流，获取更多建议</li>
              </ol>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">2. 常见问题</h3>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">2.1 无法导入课表怎么办？</h4>
              <p className="text-gray-600 mb-4">
                <strong>解决方案：</strong>
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>检查您的网络连接是否正常</li>
                <li>确认您的学校信息门户用户名和密码是否正确</li>
                <li>确认您的学校信息门户是否可以正常访问</li>
                <li>如果问题仍然存在，请联系系统管理员</li>
              </ul>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">2.2 如何修改课程信息？</h4>
              <p className="text-gray-600 mb-4">
                <strong>解决方案：</strong>
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>在日程总览页面，找到您要修改的课程</li>
                <li>点击课程卡片上的编辑按钮</li>
                <li>在弹出的编辑窗口中修改课程信息</li>
                <li>点击"保存"按钮</li>
              </ul>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">2.3 如何删除考试提醒？</h4>
              <p className="text-gray-600 mb-4">
                <strong>解决方案：</strong>
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>在考试提醒页面，找到您要删除的考试</li>
                <li>点击考试卡片上的删除按钮</li>
                <li>在确认对话框中点击"确定"按钮</li>
              </ul>
              
              <h4 className="text-md font-medium text-gray-800 mb-2">2.4 如何设置单双周课程？</h4>
              <p className="text-gray-600 mb-4">
                <strong>解决方案：</strong>
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>在编辑课程信息时，在"周类型"选项中选择"单周"或"双周"</li>
                <li>系统会根据当前周数自动显示或隐藏单双周课程</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">3. 联系支持</h3>
              <p className="text-gray-600 mb-4">
                如果您在使用过程中遇到任何问题，请通过以下方式联系我们：
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>邮箱：support@campussync.com</li>
                <li>电话：+86 123 4567 8910</li>
                <li>在线客服：工作日 9:00-18:00</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">4. 系统更新日志</h3>
              <p className="text-gray-600 mb-4">
                <strong>v1.0 (2026-04-25)</strong>
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-4 space-y-2">
                <li>初始版本发布</li>
                <li>实现课程表导入功能</li>
                <li>实现考试提醒功能</li>
                <li>实现会议管理功能</li>
                <li>实现AI个性化学习辅助功能</li>
              </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


