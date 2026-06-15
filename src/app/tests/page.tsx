'use client';

import { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/sidebar";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Save, BookOpen, ChevronRight, Loader2,
  CheckSquare, ToggleLeft, Type, Edit2, X, GripVertical,
  ClipboardList, ArrowUp, ArrowDown, Eye, EyeOff
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type QuestionType = 'mcq' | 'true_false' | 'one_word';

interface MCQOption {
  id: string;
  text: string;
}

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  marks: number;
  explanation: string;
  // MCQ specific
  options: MCQOption[];
  correctOptionId: string;
  // True/False specific
  correctBool: boolean;
  // One word specific
  correctWord: string;
}

interface Test {
  id: string;
  title: string;
  description: string;
  course_id: string;
  time_limit: number;
  pass_marks: number;
  questions: Question[];
  created_at: string;
  is_published: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Question type icons & labels
// ─────────────────────────────────────────────────────────────────────────────
const Q_TYPE_INFO: Record<QuestionType, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  mcq: { label: 'MCQ', icon: CheckSquare, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/30' },
  true_false: { label: 'True / False', icon: ToggleLeft, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  one_word: { label: 'One Word', icon: Type, color: 'text-violet-500', bg: 'bg-violet-500/10 border-violet-500/30' },
};

function newQuestion(type: QuestionType): Question {
  return {
    id: Math.random().toString(36).slice(2),
    type,
    text: '',
    marks: 1,
    explanation: '',
    options: [
      { id: 'a', text: '' },
      { id: 'b', text: '' },
      { id: 'c', text: '' },
      { id: 'd', text: '' },
    ],
    correctOptionId: 'a',
    correctBool: true,
    correctWord: '',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Question Card Component
// ─────────────────────────────────────────────────────────────────────────────
function QuestionCard({
  q, index, total,
  onUpdate, onDelete, onMoveUp, onMoveDown,
}: {
  q: Question; index: number; total: number;
  onUpdate: (updated: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const info = Q_TYPE_INFO[q.type];
  const Icon = info.icon;

  const updateOption = (id: string, text: string) => {
    onUpdate({ ...q, options: q.options.map(o => o.id === id ? { ...o, text } : o) });
  };

  const addOption = () => {
    const nextId = String.fromCharCode(97 + q.options.length);
    onUpdate({ ...q, options: [...q.options, { id: nextId, text: '' }] });
  };

  const removeOption = (id: string) => {
    if (q.options.length <= 2) return;
    onUpdate({
      ...q,
      options: q.options.filter(o => o.id !== id),
      correctOptionId: q.correctOptionId === id ? q.options[0].id : q.correctOptionId,
    });
  };

  return (
    <div className="rounded-2xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-md group">
      {/* Card Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp} disabled={index === 0}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onMoveDown} disabled={index === total - 1}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 transition-all"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className={`flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border ${info.bg} ${info.color}`}>
          <Icon className="h-3.5 w-3.5" />
          {info.label}
        </div>

        <span className="text-xs font-bold text-muted-foreground">Q{index + 1}</span>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground/80">
            {q.text || <span className="italic text-muted-foreground">Untitled question...</span>}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            {q.marks} {q.marks === 1 ? 'mark' : 'marks'}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          >
            {expanded ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Card Body */}
      {expanded && (
        <div className="p-4 space-y-4">
          {/* Question Text */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Question Text *</Label>
            <Textarea
              value={q.text}
              onChange={e => onUpdate({ ...q, text: e.target.value })}
              placeholder="Enter your question here..."
              className="resize-none min-h-[72px] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Marks */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Marks</Label>
              <Input
                type="number"
                min={1}
                value={q.marks}
                onChange={e => onUpdate({ ...q, marks: Math.max(1, parseInt(e.target.value) || 1) })}
                className="h-9 text-sm"
              />
            </div>

            {/* Question Type (in-card switcher) */}
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={q.type} onValueChange={val => onUpdate({ ...newQuestion(val as QuestionType), id: q.id, text: q.text, marks: q.marks })}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mcq">✅ MCQ</SelectItem>
                  <SelectItem value="true_false">🔄 True / False</SelectItem>
                  <SelectItem value="one_word">📝 One Word</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* MCQ Options */}
          {q.type === 'mcq' && (
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Answer Options — <span className="text-emerald-500">click radio = set correct</span>
              </Label>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div key={opt.id} className="flex items-center gap-2 group/opt">
                    <button
                      onClick={() => onUpdate({ ...q, correctOptionId: opt.id })}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        q.correctOptionId === opt.id
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-neutral-400 hover:border-emerald-400'
                      }`}
                    >
                      {q.correctOptionId === opt.id && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-muted-foreground w-4 shrink-0">
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    <Input
                      value={opt.text}
                      onChange={e => updateOption(opt.id, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      className={`h-8 text-sm flex-1 ${q.correctOptionId === opt.id ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                    />
                    <button
                      onClick={() => removeOption(opt.id)}
                      className="opacity-0 group-hover/opt:opacity-100 p-1 hover:text-rose-500 transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {q.options.length < 6 && (
                <Button type="button" variant="outline" size="sm" onClick={addOption} className="h-7 text-xs gap-1 border-dashed">
                  <Plus className="h-3.5 w-3.5" /> Add Option
                </Button>
              )}
            </div>
          )}

          {/* True / False */}
          {q.type === 'true_false' && (
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Correct Answer</Label>
              <div className="flex gap-3">
                {[true, false].map(val => (
                  <button
                    key={String(val)}
                    onClick={() => onUpdate({ ...q, correctBool: val })}
                    className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                      q.correctBool === val
                        ? val
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : 'border-rose-500 bg-rose-500/10 text-rose-600'
                        : 'border-border hover:border-primary/50 text-muted-foreground'
                    }`}
                  >
                    {val ? '✅ TRUE' : '❌ FALSE'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* One Word Answer */}
          {q.type === 'one_word' && (
            <div className="space-y-1.5">
              <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Correct Answer <span className="text-muted-foreground font-normal">(case-insensitive)</span>
              </Label>
              <Input
                value={q.correctWord}
                onChange={e => onUpdate({ ...q, correctWord: e.target.value })}
                placeholder="e.g. Python"
                className="h-9 text-sm border-violet-500/40 focus:border-violet-500"
              />
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Explanation / Hint <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              value={q.explanation}
              onChange={e => onUpdate({ ...q, explanation: e.target.value })}
              placeholder="Shown to students after submitting..."
              className="resize-none min-h-[56px] text-xs text-muted-foreground"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Builder Panel
// ─────────────────────────────────────────────────────────────────────────────
function TestBuilderPanel({ test, onClose, onSaved }: {
  test: Partial<Test>;
  onClose: () => void;
  onSaved: (t: Test) => void;
}) {
  const [title, setTitle] = useState(test.title || '');
  const [description, setDescription] = useState(test.description || '');
  const [courseId, setCourseId] = useState(
    test.course_id && test.course_id.trim().length > 0 ? test.course_id : 'NO_COURSE'
  );
  const [timeLimit, setTimeLimit] = useState(test.time_limit || 60);
  const [passMark, setPassMark] = useState(test.pass_marks || 50);
  const [questions, setQuestions] = useState<Question[]>(test.questions || []);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<{id: string; title: string}[]>([]);
  const isEditing = !!test.id;

  useEffect(() => {
    db.from('course_folders')
      .select('id, title')
      .match({ parent_folder_id: null })
      .order('title')
      .then((res: { data: any; error: any }) => setCourses(res.data || []));
  }, []);

  const addQuestion = (type: QuestionType) => {
    setQuestions(prev => [...prev, newQuestion(type)]);
  };

  const updateQuestion = (idx: number, updated: Question) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? updated : q));
  };

  const deleteQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  const moveQuestion = (idx: number, dir: 'up' | 'down') => {
    const newQ = [...questions];
    const target = dir === 'up' ? idx - 1 : idx + 1;
    [newQ[idx], newQ[target]] = [newQ[target], newQ[idx]];
    setQuestions(newQ);
  };

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  const handleSave = async (publish = false) => {
    if (!title.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Test title is required.' });
      return;
    }
    if (questions.length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Add at least one question.' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        course_id: courseId === 'NO_COURSE' ? null : (courseId || null),
        time_limit: timeLimit,
        pass_marks: passMark,
        questions: questions as any,
        is_published: publish,
      };

      let result;
      if (isEditing && test.id) {
        result = await db.from('tests').update(payload).eq('id', test.id).select().single();
      } else {
        result = await db.from('tests').insert(payload).select().single();
      }

      if (result.error) throw new Error(result.error.message);
      toast({ title: publish ? 'Test Published!' : 'Test Saved', description: publish ? 'Students can now take this test.' : 'Draft saved successfully.' });
      onSaved(result.data as Test);
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Save Failed', description: err.message || 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-500/10 via-transparent to-transparent shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/15 flex items-center justify-center">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-bold text-sm">{isEditing ? 'Edit Test' : 'Create New Test'}</h2>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Test Builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 text-xs font-bold">
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(false)}
            disabled={saving}
            variant="outline"
            className="h-8 text-xs font-bold"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Save Draft
          </Button>
          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            Publish Test
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
          {/* Test Metadata */}
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-500" /> Test Details
            </h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Test Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. JavaScript Midterm Exam" className="h-9 text-sm font-semibold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief test overview, rules, topics covered..." className="resize-none min-h-[72px] text-sm" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Linked Course</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select course..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_COURSE">No course</SelectItem>
                      {courses
                        .filter(c => c.id && c.id.trim().length > 0)
                        .map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Time Limit (mins)</Label>
                  <Input type="number" min={5} value={timeLimit} onChange={e => setTimeLimit(Math.max(5, parseInt(e.target.value) || 60))} className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pass % Marks</Label>
                  <Input type="number" min={1} max={100} value={passMark} onChange={e => setPassMark(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))} className="h-9 text-sm" />
                </div>
              </div>

              {/* Summary Badge */}
              {questions.length > 0 && (
                <div className="flex items-center gap-3 pt-1 flex-wrap">
                  <Badge variant="outline" className="text-xs font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    {questions.length} Questions
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400">
                    {totalMarks} Total Marks
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold border-blue-500/30 text-blue-600 dark:text-blue-400">
                    {questions.filter(q => q.type === 'mcq').length} MCQ
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {questions.filter(q => q.type === 'true_false').length} True/False
                  </Badge>
                  <Badge variant="outline" className="text-xs font-bold border-violet-500/30 text-violet-600 dark:text-violet-400">
                    {questions.filter(q => q.type === 'one_word').length} One Word
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Question List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Questions ({questions.length})</h3>
            </div>

            {questions.length === 0 && (
              <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center">
                <ClipboardList className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-semibold text-muted-foreground">No questions yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add questions using the buttons below</p>
              </div>
            )}

            {questions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                q={q}
                index={idx}
                total={questions.length}
                onUpdate={updated => updateQuestion(idx, updated)}
                onDelete={() => deleteQuestion(idx)}
                onMoveUp={() => moveQuestion(idx, 'up')}
                onMoveDown={() => moveQuestion(idx, 'down')}
              />
            ))}
          </div>

          {/* Add Question Buttons */}
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Add Question</p>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(Q_TYPE_INFO) as [QuestionType, typeof Q_TYPE_INFO[QuestionType]][]).map(([type, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={type}
                    onClick={() => addQuestion(type)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${info.bg} ${info.color} hover:border-current`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>+ {info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Test List Card
// ─────────────────────────────────────────────────────────────────────────────
function TestCard({ test, onEdit, onDelete }: { test: Test; onEdit: () => void; onDelete: () => void }) {
  const totalMarks = test.questions?.reduce((s, q) => s + q.marks, 0) ?? 0;
  const mcqCount = test.questions?.filter(q => q.type === 'mcq').length ?? 0;
  const tfCount = test.questions?.filter(q => q.type === 'true_false').length ?? 0;
  const owCount = test.questions?.filter(q => q.type === 'one_word').length ?? 0;

  return (
    <div className="rounded-2xl border bg-card hover:shadow-md transition-all duration-200 overflow-hidden group">
      <div className={`h-1.5 w-full ${test.is_published ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-gradient-to-r from-neutral-400 to-neutral-500'}`} />
      <div className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-sm">{test.title}</h3>
              <Badge className={`text-[10px] px-2 py-0.5 ${test.is_published ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' : 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20'} border`}>
                {test.is_published ? '🌐 Published' : '📝 Draft'}
              </Badge>
            </div>
            {test.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{test.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold">{test.questions?.length ?? 0} Qs</span>
          <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-semibold border border-amber-500/20">{totalMarks} marks</span>
          <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-semibold border border-blue-500/20">{mcqCount} MCQ</span>
          {tfCount > 0 && <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/20">{tfCount} T/F</span>}
          {owCount > 0 && <span className="text-[10px] bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-semibold border border-violet-500/20">{owCount} OW</span>}
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold">⏱ {test.time_limit}m</span>
          <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-semibold">✅ Pass: {test.pass_marks}%</span>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-7 text-xs font-bold gap-1 flex-1">
            <Edit2 className="h-3.5 w-3.5" /> Edit Test
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 text-xs font-bold gap-1 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 px-2">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function TestsAdminPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTest, setEditingTest] = useState<Partial<Test> | null>(null);

  const fetchTests = async () => {
    setLoading(true);
    const { data, error } = await db.from('tests').select('*').order('created_at', { ascending: false });
    if (!error) setTests((data || []) as Test[]);
    setLoading(false);
  };

  useEffect(() => { fetchTests(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this test permanently?')) return;
    await db.from('tests').delete().eq('id', id);
    setTests(prev => prev.filter(t => t.id !== id));
    toast({ title: 'Test deleted.' });
  };

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset className="bg-muted/10">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-background px-6">
          <SidebarTrigger />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline font-bold text-xl">Test Builder</h1>
            <p className="text-xs text-muted-foreground">Create MCQ, True/False & One-Word answer tests for your students.</p>
          </div>
          {!editingTest && (
            <Button
              size="sm"
              className="h-9 font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              onClick={() => setEditingTest({})}
            >
              <Plus className="h-4 w-4" /> Create Test
            </Button>
          )}
          {editingTest && (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg">
              <ClipboardList className="h-3.5 w-3.5" />
              {editingTest.id ? 'Editing Test' : 'New Test'}
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
            </div>
          )}
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
          {/* Test List */}
          {!editingTest && (
            <div className="flex-1 overflow-auto p-6 md:p-8">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl border bg-card h-44 animate-pulse" />
                  ))}
                </div>
              ) : tests.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-80 text-center space-y-4">
                  <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center">
                    <ClipboardList className="h-10 w-10 text-indigo-500/60" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">No tests yet</h2>
                    <p className="text-sm text-muted-foreground mt-1">Create your first assessment test to get started.</p>
                  </div>
                  <Button
                    className="h-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    onClick={() => setEditingTest({})}
                  >
                    <Plus className="h-4 w-4" /> Create First Test
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {tests.map(test => (
                    <TestCard
                      key={test.id}
                      test={test}
                      onEdit={() => setEditingTest(test)}
                      onDelete={() => handleDelete(test.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Builder Panel */}
          {editingTest && (
            <div className="flex-1 overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <TestBuilderPanel
                test={editingTest}
                onClose={() => setEditingTest(null)}
                onSaved={(saved) => {
                  setEditingTest(null);
                  fetchTests();
                }}
              />
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

