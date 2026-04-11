import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp, BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Exam, ExamMilestone, CreateExamInput, ExamStatus } from '@/types';
import { examsApi } from '@/lib/api';

// Get exam dates for the current year based on common schedules
const getCurrentYearExamDates = () => {
  const currentYear = new Date().getFullYear();
  return {
    CET4: {
     上半年: `${currentYear}-06-15`, // 通常在6月第三个周六
     下半年: `${currentYear}-12-15`, // 通常在12月第三个周六
    },
    CET6: {
     上半年: `${currentYear}-06-15`, // 通常与CET4同一天
     下半年: `${currentYear}-12-15`, // 通常与CET4同一天
    },
    NCRE1: {
     上半年: `${currentYear}-03-30`, // 通常在3月底
     下半年: `${currentYear}-09-28`, // 通常在9月底
    },
    NCRE2: {
     上半年: `${currentYear}-03-30`, // 通常与NCRE1同一天
     下半年: `${currentYear}-09-28`, // 通常与NCRE1同一天
    },
  };
};

const EXAM_TEMPLATES = [
  { name: '大学英语四级 (CET-4)', examType: 'CET4', reminderDaysBefore: 14 },
  { name: '大学英语六级 (CET-6)', examType: 'CET6', reminderDaysBefore: 14 },
  { name: '全国计算机等级考试一级', examType: 'NCRE1', reminderDaysBefore: 7 },
  { name: '全国计算机等级考试二级', examType: 'NCRE2', reminderDaysBefore: 7 },
  { name: '自定义考试', examType: 'custom', reminderDaysBefore: 7 },
];

const STATUS_LABELS: Record<ExamStatus, { label: string; cls: string }> = {
  upcoming: { label: '即将到来', cls: 'bg-amber-50 text-amber-700' },
  registered: { label: '已报名', cls: 'bg-green-50 text-green-700' },
  completed: { label: '已完成', cls: 'bg-[oklch(0.87_0.02_240)] text-[oklch(0.48_0.05_240)]' },
};

const getDaysUntil = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

interface Props {
  exams: Exam[];
  onExamsChange: () => void;
}

export default function ExamView({ exams, onExamsChange }: Props) {
  const [showAddExam, setShowAddExam] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newMilestone, setNewMilestone] = useState<Record<string, string>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [newExam, setNewExam] = useState<CreateExamInput>({
    name: EXAM_TEMPLATES[0].name,
    examType: EXAM_TEMPLATES[0].examType,
    examDate: '',
    registrationDeadline: '',
    location: '',
    status: 'upcoming',
    prepProgress: 0,
    reminderDaysBefore: EXAM_TEMPLATES[0].reminderDaysBefore,
    notes: '',
  });

  const handleTemplateSelect = (idx: number) => {
    setSelectedTemplate(idx);
    const t = EXAM_TEMPLATES[idx];
    const examDates = getCurrentYearExamDates();
    let examDate = '';
    
    // 根据当前时间选择合适的考试日期
    if (t.examType !== 'custom') {
      const currentDate = new Date();
      const examDateOptions = examDates[t.examType as keyof typeof examDates];
      if (examDateOptions) {
        const firstHalfYear = new Date(examDateOptions.上半年);
        const secondHalfYear = new Date(examDateOptions.下半年);
        
        // 如果当前时间在上半年考试之前，选择上半年考试
        // 否则选择下半年考试
        if (currentDate < firstHalfYear) {
          examDate = examDateOptions.上半年;
        } else if (currentDate < secondHalfYear) {
          examDate = examDateOptions.下半年;
        } else {
          // 如果下半年考试也已过去，选择下一年的上半年考试
          const nextYear = currentDate.getFullYear() + 1;
          examDate = `${nextYear}-06-15`; // 默认下一年6月
        }
      }
    }
    
    setNewExam(p => ({ 
      ...p, 
      name: t.name, 
      examType: t.examType, 
      reminderDaysBefore: t.reminderDaysBefore,
      examDate
    }));
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExam.examDate) { toast.error('请选择考试日期'); return; }
    try {
      const res = await examsApi.create(newExam);
      if (res.success) {
        toast.success('考试提醒已添加');
        setShowAddExam(false);
        onExamsChange();
      } else {
        toast.error('添加失败', { description: res.message });
      }
    } catch {
      toast.error('网络错误');
    }
  };

  const handleDeleteExam = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await examsApi.delete(id);
      if (res.success) { toast.success('考试已删除'); onExamsChange(); }
      else toast.error('删除失败');
    } catch { toast.error('网络错误'); }
    finally { setLoadingId(null); }
  };

  const handleUpdateProgress = async (exam: Exam, progress: number) => {
    try {
      const res = await examsApi.update(exam.id, { prepProgress: progress });
      if (res.success) onExamsChange();
    } catch { toast.error('更新失败'); }
  };

  const handleUpdateStatus = async (exam: Exam, status: ExamStatus) => {
    try {
      const res = await examsApi.update(exam.id, { status });
      if (res.success) { toast.success('状态已更新'); onExamsChange(); }
    } catch { toast.error('更新失败'); }
  };

  const handleAddMilestone = async (examId: string) => {
    const title = newMilestone[examId]?.trim();
    if (!title) return;
    try {
      const res = await examsApi.createMilestone(examId, title);
      if (res.success) {
        setNewMilestone(p => ({ ...p, [examId]: '' }));
        onExamsChange();
      }
    } catch { toast.error('网络错误'); }
  };

  const handleToggleMilestone = async (milestone: ExamMilestone) => {
    try {
      const res = await examsApi.updateMilestone(milestone.id, { completed: !milestone.completed });
      if (res.success) onExamsChange();
    } catch { toast.error('更新失败'); }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    try {
      const res = await examsApi.deleteMilestone(milestoneId);
      if (res.success) onExamsChange();
    } catch { toast.error('网络错误'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[oklch(0.12_0.025_240)] font-serif">标准化考试提醒</h2>
          <p className="text-sm text-[oklch(0.48_0.05_240)] mt-0.5">管理 CET-4/6、计算机等级考试及自定义考试</p>
        </div>
        <button
          onClick={() => setShowAddExam(true)}
          className="flex items-center gap-2 bg-[oklch(0.28_0.07_240)] hover:bg-[oklch(0.32_0.07_240)] text-white font-semibold px-4 py-2 rounded-xl text-sm transition-all min-h-[40px] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          添加考试
        </button>
      </div>

      {/* Add Exam Form */}
      {showAddExam && (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-6">
          <h3 className="font-bold text-[oklch(0.12_0.025_240)] mb-4 font-serif">添加考试提醒</h3>
          {/* Template Selector */}
          <div className="mb-4">
            <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-2">选择考试类型</label>
            <div className="flex flex-wrap gap-2">
              {EXAM_TEMPLATES.map((t, i) => (
                <button key={i} type="button" onClick={() => handleTemplateSelect(i)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                    selectedTemplate === i
                      ? 'bg-[oklch(0.28_0.07_240)] text-white border-[oklch(0.28_0.07_240)]'
                      : 'bg-[oklch(0.955_0.008_240)] text-[oklch(0.48_0.05_240)] border-[oklch(0.87_0.02_240)] hover:border-[oklch(0.28_0.07_240)]/40'
                  }`}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleAddExam} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">考试名称 *</label>
              <input value={newExam.name} onChange={e => setNewExam(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">考试日期 *</label>
              <input type="date" value={newExam.examDate} onChange={e => setNewExam(p => ({ ...p, examDate: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">报名截止日</label>
              <input type="date" value={newExam.registrationDeadline} onChange={e => setNewExam(p => ({ ...p, registrationDeadline: e.target.value }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">考试地点</label>
              <input value={newExam.location} onChange={e => setNewExam(p => ({ ...p, location: e.target.value }))}
                placeholder="例：第三教学楼 B201"
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">提前提醒天数</label>
              <input type="number" min={1} max={60} value={newExam.reminderDaysBefore}
                onChange={e => setNewExam(p => ({ ...p, reminderDaysBefore: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[oklch(0.12_0.025_240)] mb-1">备考进度 (%)</label>
              <input type="number" min={0} max={100} value={newExam.prepProgress}
                onChange={e => setNewExam(p => ({ ...p, prepProgress: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-[oklch(0.955_0.008_240)] border border-[oklch(0.87_0.02_240)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all" />
            </div>
            <div className="sm:col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowAddExam(false)}
                className="px-4 py-2 text-sm text-[oklch(0.48_0.05_240)] border border-[oklch(0.87_0.02_240)] rounded-xl hover:text-[oklch(0.12_0.025_240)] transition-all">
                取消
              </button>
              <button type="submit"
                className="px-6 py-2 bg-[oklch(0.28_0.07_240)] text-white text-sm font-semibold rounded-xl hover:bg-[oklch(0.32_0.07_240)] transition-all">
                添加考试
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exam Cards */}
      {exams.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm p-12 text-center">
          <BookOpen className="w-12 h-12 text-[oklch(0.87_0.02_240)] mx-auto mb-3" />
          <p className="text-sm text-[oklch(0.48_0.05_240)]">暂无考试提醒，点击「添加考试」开始设置</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map(exam => {
            const daysUntil = getDaysUntil(exam.examDate);
            const regDays = exam.registrationDeadline ? getDaysUntil(exam.registrationDeadline) : null;
            const isExpanded = expandedId === exam.id;
            const statusInfo = STATUS_LABELS[exam.status as ExamStatus] || STATUS_LABELS.upcoming;

            return (
              <div key={exam.id} className="bg-white rounded-2xl border border-[oklch(0.87_0.02_240)] shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-[oklch(0.28_0.07_240)] rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xs font-serif">
                        {exam.examType === 'CET4' ? '四级' : exam.examType === 'CET6' ? '六级' :
                         exam.examType === 'NCRE1' ? '一级' : exam.examType === 'NCRE2' ? '二级' : '自定义'}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-[oklch(0.12_0.025_240)]">{exam.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.cls}`}>{statusInfo.label}</span>
                        {regDays !== null && regDays > 0 && regDays <= 30 && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium">报名截止 {regDays}天后</span>
                        )}
                      </div>
                      <p className="text-sm text-[oklch(0.48_0.05_240)] mb-3">
                        考试日期：{exam.examDate}
                        {daysUntil > 0 ? ` · 还有 ${daysUntil} 天` : daysUntil === 0 ? ' · 今天考试' : ' · 已结束'}
                        {exam.location ? ` · ${exam.location}` : ''}
                      </p>
                      {/* Progress */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-[oklch(0.87_0.02_240)] rounded-full h-1.5">
                          <div className="bg-[oklch(0.28_0.07_240)] h-1.5 rounded-full transition-all" style={{ width: `${exam.prepProgress}%` }} />
                        </div>
                        <span className="text-xs text-[oklch(0.48_0.05_240)] flex-shrink-0">备考进度 {exam.prepProgress}%</span>
                      </div>
                      {/* Progress Slider */}
                      <input type="range" min={0} max={100} value={exam.prepProgress}
                        onChange={e => handleUpdateProgress(exam, Number(e.target.value))}
                        className="w-full mt-2 accent-[oklch(0.28_0.07_240)]" />
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <select value={exam.status}
                        onChange={e => handleUpdateStatus(exam, e.target.value as ExamStatus)}
                        className="text-xs border border-[oklch(0.87_0.02_240)] rounded-lg px-2 py-1 bg-white text-[oklch(0.12_0.025_240)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.28_0.07_240)]/30">
                        <option value="upcoming">即将到来</option>
                        <option value="registered">已报名</option>
                        <option value="completed">已完成</option>
                      </select>
                      <button onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                        className="p-1.5 hover:bg-[oklch(0.955_0.008_240)] rounded-lg transition-all">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-[oklch(0.48_0.05_240)]" /> : <ChevronDown className="w-4 h-4 text-[oklch(0.48_0.05_240)]" />}
                      </button>
                      <button onClick={() => handleDeleteExam(exam.id)} disabled={loadingId === exam.id}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-all text-red-500 disabled:opacity-50">
                        {loadingId === exam.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                {isExpanded && (
                  <div className="border-t border-[oklch(0.87_0.02_240)] px-5 py-4 bg-[oklch(0.955_0.008_240)]">
                    <h4 className="text-xs font-semibold text-[oklch(0.12_0.025_240)] mb-3">备考里程碑</h4>
                    <div className="space-y-2 mb-3">
                      {exam.milestones.length === 0 && (
                        <p className="text-xs text-[oklch(0.48_0.05_240)]">暂无里程碑，添加备考节点</p>
                      )}
                      {exam.milestones.map(m => (
                        <div key={m.id} className="flex items-center gap-2 group">
                          <button onClick={() => handleToggleMilestone(m)} className="flex-shrink-0">
                            {m.completed
                              ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                              : <Circle className="w-4 h-4 text-[oklch(0.87_0.02_240)]" />}
                          </button>
                          <span className={`text-sm flex-1 ${m.completed ? 'line-through text-[oklch(0.48_0.05_240)]' : 'text-[oklch(0.12_0.025_240)]'}`}>{m.title}</span>
                          {m.dueDate && <span className="text-xs text-[oklch(0.48_0.05_240)]">{m.dueDate}</span>}
                          <button onClick={() => handleDeleteMilestone(m.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded text-red-400 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={newMilestone[exam.id] || ''}
                        onChange={e => setNewMilestone(p => ({ ...p, [exam.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleAddMilestone(exam.id)}
                        placeholder="添加里程碑，如「词汇复习」"
                        className="flex-1 px-3 py-1.5 bg-white border border-[oklch(0.87_0.02_240)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[oklch(0.28_0.07_240)]/30 focus:border-[oklch(0.28_0.07_240)] transition-all"
                      />
                      <button onClick={() => handleAddMilestone(exam.id)}
                        className="px-3 py-1.5 bg-[oklch(0.28_0.07_240)] text-white text-xs font-semibold rounded-lg hover:bg-[oklch(0.32_0.07_240)] transition-all">
                        添加
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
